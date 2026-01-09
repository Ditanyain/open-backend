import axios from "axios";
import { lmsConfig } from "@/config/lms.config";
import { notFoundError } from "@/core/exceptions/notFoundError.exception";

const getUserPreferences = async (userId: number) => {
  try {
    const { data } = await axios.get(
      `${lmsConfig.baseURL}/users/${userId}/preferences`
    );
    return data.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw notFoundError("User with that id does not exist");
    }
    throw error;
  }
};

export { getUserPreferences };
