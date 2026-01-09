import axios from "axios";
import { lmsConfig } from "@/config/lms.config";
import { notFoundError } from "@/core/exceptions/notFoundError.exception";

const getTutorial = async (tutorialId: number) => {
  try {
    const { data } = await axios.get(
      `${lmsConfig.baseURL}/tutorials/${tutorialId}`
    );
    return data.data.content;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw notFoundError("Tutorial with that id does not exist");
    }
    throw error;
  }
};

export { getTutorial };
