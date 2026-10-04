import { isDuplicateKeyError } from "@/lib/server/student-api";
import { demoSettings, settingsTimeSlots } from "@/lib/settings-management";
import { membershipPlans } from "@/lib/student-management";
import { LibraryConfigurationModel } from "@/models/LibraryConfiguration";

export function defaultLibraryConfiguration(libraryId: string) {
  return {
    libraryId,
    settings: demoSettings,
    timeSlots: settingsTimeSlots,
    membershipPlans: membershipPlans.map((plan) => ({
      ...plan,
      active: true,
    })),
  };
}

export async function getOrCreateLibraryConfiguration(libraryId: string) {
  try {
    return await LibraryConfigurationModel.findOneAndUpdate(
      { libraryId },
      { $setOnInsert: defaultLibraryConfiguration(libraryId) },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    return LibraryConfigurationModel.findOne({ libraryId }).lean();
  }
}
