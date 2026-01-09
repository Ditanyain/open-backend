import { Channel, ConsumeMessage } from "amqplib";
import { getTutorial } from "@/shared/services/lms.service";
import {
  addOption,
  addQuestion,
  hasQuestionsForTutorial,
  isDuplicateQuestion,
  getExistingQuestions,
} from "./services/postgresql/quizzes.service";
import {
  acquireQuizGenerationLock,
  markQuizGenerationDone,
  markBatchProgress,
} from "./services/postgresql/quizGenerations.service";

import { generateQuizBatch } from "./services/llm/generator.service";
import { getBatchConfig } from "./helper";
import { sendMessage } from "@/shared/services/producer.service";

const MAX_RETRIES = 3;
const DUPLICATE_THRESHOLD = 0.4;
const MAX_REGENERATE_ATTEMPTS = 2;

type QuizJobMessage = {
  tutorialId: number;
  batchNumber?: number;
  retryCount?: number;
  regenerateAttempt?: number;
  generationId?: string;
};

const quizGenerateHandler = async (msg: ConsumeMessage | null) => {
  if (!msg) return;

  const payload = JSON.parse(msg.content.toString()) as QuizJobMessage;

  const {
    tutorialId,
    batchNumber = 1,
    retryCount = 0,
    regenerateAttempt = 0,
    generationId: generationIdFromMsg,
  } = payload;

  if (!tutorialId) {
    console.error("Missing tutorialId from message payload");
    return;
  }

  console.log(
    `Process generate quizzes for tutorial: ${tutorialId}, batch: ${batchNumber}, retry: ${retryCount}, regen: ${regenerateAttempt}, genId: ${
      generationIdFromMsg ?? "-"
    }`
  );

  const tutorial = await getTutorial(tutorialId);

  if (!tutorial) {
    console.error("Tutorial not found", { tutorialId });
    return;
  }

  // 🔥 Pastikan kita punya generationId
  let generationId = generationIdFromMsg;

  // Batch 1 pertama kali: cek sudah ada question? lalu acquire lock (lease)
  if (batchNumber === 1 && retryCount === 0 && regenerateAttempt === 0) {
    const alreadyHasQuestions = await hasQuestionsForTutorial(tutorialId);

    if (alreadyHasQuestions) {
      console.log("Tutorial already has quizzes, skip generation", {
        tutorialId,
      });
      return;
    }

    const lock = await acquireQuizGenerationLock(tutorialId);
    if (!lock) {
      console.log(
        "Skip generation: another process already holds quiz generation lock (active lease)",
        { tutorialId }
      );
      return;
    }

    generationId = lock.id;
    console.log("Lock acquired", { tutorialId, generationId });
  }

  // Untuk batch > 1 atau retry/regenerate: generationId WAJIB ada
  if (!generationId) {
    console.error(
      "Missing generationId (cannot update progress/done safely).",
      {
        tutorialId,
        batchNumber,
        retryCount,
        regenerateAttempt,
      }
    );
    return;
  }

  try {
    const batchConfig = getBatchConfig(tutorial);
    const currentBatch = batchConfig.batches[batchNumber - 1];

    if (!currentBatch) {
      console.error("Invalid batch number", { tutorialId, batchNumber });
      return;
    }

    console.log(
      `Generating ${currentBatch.questionCount} questions for batch ${batchNumber}/${batchConfig.batchCount}`
    );

    const existingQuestions = await getExistingQuestions(tutorialId);

    const quiz = await generateQuizBatch(
      tutorial,
      currentBatch.questionCount,
      batchNumber,
      existingQuestions
    );

    let savedCount = 0;
    let duplicateCount = 0;

    for (const question of quiz.questions) {
      if (!question.questionId) {
        console.error("Missing questionId from LLM response", {
          tutorialId,
          question,
        });
        continue;
      }

      if (!question.question) {
        console.error("Missing question text", {
          tutorialId,
          questionId: question.questionId,
        });
        continue;
      }

      const isDuplicate = await isDuplicateQuestion(
        tutorialId,
        question.question
      );

      if (isDuplicate) {
        console.warn(
          `Duplicate question detected, skipping: "${question.question.substring(
            0,
            50
          )}..."`
        );
        duplicateCount++;
        continue;
      }

      const type = (question.type || "SINGLE").trim().toUpperCase();

      await addQuestion(
        question.questionId,
        tutorialId,
        question.question,
        type
      );

      for (const option of question.options) {
        if (!option.optionId) {
          console.error(
            `Missing optionId for question ${question.questionId}`,
            {
              tutorialId,
            }
          );
          continue;
        }
        if (!option.option) {
          console.error(
            `Missing option text for question ${question.questionId}`,
            {
              tutorialId,
              optionId: option.optionId,
            }
          );
          continue;
        }

        await addOption(
          option.optionId,
          question.questionId,
          option.option,
          option.explanation ?? "",
          option.isCorrect ?? false
        );
      }

      savedCount++;
    }

    console.log(
      `Batch ${batchNumber}: saved ${savedCount} questions, skipped ${duplicateCount} duplicates`
    );

    const duplicateRate = duplicateCount / currentBatch.questionCount;

    // Regenerate: kirim message dengan generationId yang sama
    if (
      duplicateRate >= DUPLICATE_THRESHOLD &&
      regenerateAttempt < MAX_REGENERATE_ATTEMPTS
    ) {
      console.warn(
        `🔄 High duplicate rate (${(duplicateRate * 100).toFixed(
          0
        )}%) in batch ${batchNumber}. Regenerating... (attempt ${
          regenerateAttempt + 1
        }/${MAX_REGENERATE_ATTEMPTS})`
      );

      const regenerateMessage: QuizJobMessage = {
        tutorialId,
        generationId,
        batchNumber,
        retryCount: 0,
        regenerateAttempt: regenerateAttempt + 1,
      };

      await sendMessage(JSON.stringify(regenerateMessage));
      return;
    }

    if (duplicateRate >= DUPLICATE_THRESHOLD) {
      console.warn(
        `⚠️ Too many duplicates in batch ${batchNumber} (${duplicateCount}/${currentBatch.questionCount}), but max regenerate attempts reached. Continuing...`
      );
    }

    // 🔥 progress update by generationId (dan di dalamnya refresh lock_until)
    await markBatchProgress(generationId, batchNumber, batchConfig.batchCount);

    console.log(
      `✅ Batch ${batchNumber}/${batchConfig.batchCount} completed for tutorial: ${tutorialId}`
    );

    if (batchNumber < batchConfig.batchCount) {
      const nextMessage: QuizJobMessage = {
        tutorialId,
        generationId,
        batchNumber: batchNumber + 1,
        retryCount: 0,
        regenerateAttempt: 0,
      };

      await sendMessage(JSON.stringify(nextMessage));
      console.log(
        `📤 Queued batch ${batchNumber + 1} for tutorial: ${tutorialId}`
      );
    } else {
      await markQuizGenerationDone(generationId);
      console.log(`🎉 All batches completed for tutorial: ${tutorialId}`);
    }
  } catch (error) {
    console.error("Unexpected error during quiz generation", {
      tutorialId,
      generationId,
      batchNumber,
      retryCount,
      regenerateAttempt,
      error,
    });

    if (retryCount < MAX_RETRIES) {
      const retryMessage: QuizJobMessage = {
        tutorialId,
        generationId,
        batchNumber,
        retryCount: retryCount + 1,
        regenerateAttempt,
      };

      const delayMs = 5000 * Math.pow(2, retryCount);

      setTimeout(async () => {
        await sendMessage(JSON.stringify(retryMessage));
        console.log(
          `🔁 Retry ${
            retryCount + 1
          }/${MAX_RETRIES} queued for batch ${batchNumber} after ${delayMs}ms`
        );
      }, delayMs);
    } else {
      console.error(`❌ Max retries reached for batch ${batchNumber}.`, {
        tutorialId,
        generationId,
      });

      // opsional: tandai DONE biar lock lepas cepat (atau biarkan expire)
      await markQuizGenerationDone(generationId);
    }
  }
};

const quizListener = async (channel: Channel, queueName: string) => {
  await channel.assertQueue(queueName, { durable: true });

  channel.consume(queueName, quizGenerateHandler, {
    noAck: true,
  });
};

export default quizListener;
