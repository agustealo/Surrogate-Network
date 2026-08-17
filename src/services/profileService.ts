'use server';

import { profileRepository } from '@/application/services/index';
import type { Profile, CreateProfileDto } from '@/repositories/ProfileRepository';

/**
 * Fetches a list of all profiles from Supabase.
 * @param count - Maximum number of profiles to return
 * @returns A promise that resolves to an array of Profile objects.
 */
export async function fetchProfiles(count: number = 20): Promise<Profile[]> {
  try {
    return await profileRepository.findAll(count);
  } catch (error) {
    console.error("Error fetching profiles: ", error);
    throw new Error("Could not fetch profiles.");
  }
}

/**
 * Fetches a single profile by its ID from Supabase.
 * @param id - The ID of the profile to fetch.
 * @returns A promise that resolves to a Profile object or null if not found or on error.
 */
export async function fetchProfileById(id: string): Promise<Profile | null> {
  if (!id || typeof id !== 'string' || id.trim() === "") {
    console.error("fetchProfileById was called with an invalid ID:", id);
    return null; 
  }
  try {
    return await profileRepository.findById(id);
  } catch (error: any) {
    console.error(`Error fetching profile by ID '${id}': `, error);
    throw new Error(`Failed to fetch profile for ID '${id}'. Original error: ${error.message || String(error)}`);
  }
}

/**
 * Adds a new profile to Supabase.
 * @param profileData - The data for the new profile.
 * @returns A promise that resolves to the newly created Profile object.
 */
export async function addProfile(profileData: CreateProfileDto): Promise<Profile> {
  try {
    return await profileRepository.create(profileData);
  } catch (error) {
    console.error("Error adding profile: ", error);
    throw new Error("Could not add profile.");
  }
}

/**
 * Updates an existing profile in Supabase.
 * @param id - The ID of the profile to update.
 * @param profileData - The data to update.
 * @returns A promise that resolves to the updated Profile object.
 */
export async function updateProfile(id: string, profileData: Partial<CreateProfileDto>): Promise<Profile> {
  try {
    return await profileRepository.update(id, profileData);
  } catch (error) {
    console.error("Error updating profile: ", error);
    throw new Error("Could not update profile.");
  }
}