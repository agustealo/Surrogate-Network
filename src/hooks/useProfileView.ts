// Profile view controller hook
// Centralized profile data management and state orchestration

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import type { Profile } from '@/repositories/ProfileRepository';
import { fetchProfileById } from '@/services/profileService';
import { useToast } from '@/hooks/use-toast';
import { getDemoData } from '@/dev/fixtures';
import { EmptyState, LoadingState, ErrorState } from '@/components/shared';

type ProfileType = Profile;

interface Offering {
  id: string;
  title: string;
  description: string;
  category: string;
  averageRating?: number;
  ratingCount?: number;
  boundaries?: string[];
  tokenReward?: number;
  tokenCost?: number;
}

interface ProfileRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  tags?: string[];
  averageRating?: number;
  ratingCount?: number;
  boundaries?: string[];
  tokenCost?: number;
  tokenReward?: number;
}

interface UseProfileViewResult {
  profile: ProfileType | null;
  isLoading: boolean;
  error: string | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isProposalDialogOpen: boolean;
  selectedRequest: ProfileRequest | null;
  selectedOffering: Offering | null;
  handleProposalDialogOpen: (request: ProfileRequest) => void;
  handleProposalDialogClose: () => void;
  handleSelectOffering: (offering: Offering) => void;
  handleSendProposal: () => void;
  handleRetry: () => void;
}

export function useProfileView(): UseProfileViewResult {
  const params = useParams();
  const userId = params.id as string;
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ProfileRequest | null>(null);
  const [selectedOffering, setSelectedOffering] = useState<Offering | null>(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchProfileById(userId);
      
      if (data) {
        setProfile(data as ProfileType);
        document.title = `${data.name} - Profile | Surrogate Network`;
      } else {
        // Fall back to demo data if no real data found
        const demoProfile = getDemoData<ProfileType>('users', undefined);
        if (demoProfile) {
          setProfile(demoProfile);
          document.title = `${demoProfile.name} - Profile (Demo) | Surrogate Network`;
          toast({
            title: "Using Demo Data",
            description: `Could not find live profile for ID ${userId}. Displaying sample data instead.`,
            variant: "default",
          });
        } else {
          setError(`Profile not found: ${userId}`);
          document.title = `Profile Not Found | Surrogate Network`;
        }
      }
    } catch (err: any) {
      console.error(`Error loading profile ${userId}:`, err);
      
      // Try to fall back to demo data
      const demoProfile = getDemoData<ProfileType>('users', undefined);
      if (demoProfile) {
        setProfile(demoProfile);
        document.title = `${demoProfile.name} - Profile (Demo Fallback) | Surrogate Network`;
        toast({
          title: "Offline Mode / Data Error",
          description: `Displaying sample data. Original error: ${err.message || 'Unknown error'}`,
          variant: "default",
        });
      } else {
        setError(`Failed to load profile: ${err.message || 'Unknown error'}`);
        document.title = `Profile Not Found | Surrogate Network`;
        toast({
          title: "Profile Loading Failed",
          description: `Could not load profile for ID ${userId}.`,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId, loadProfile]);

  const handleProposalDialogOpen = useCallback((request: ProfileRequest) => {
    setSelectedRequest(request);
    setSelectedOffering(null);
    setIsProposalDialogOpen(true);
  }, []);

  const handleProposalDialogClose = useCallback(() => {
    setIsProposalDialogOpen(false);
    setSelectedRequest(null);
    setSelectedOffering(null);
  }, []);

  const handleSelectOffering = useCallback((offering: Offering) => {
    setSelectedOffering(offering);
  }, []);

  const handleSendProposal = useCallback(() => {
    if (!selectedOffering || !selectedRequest) {
      toast({ 
        title: "Please select an offering", 
        variant: "destructive" 
      });
      return;
    }
    
    console.log(`PROPOSAL: User offers '${selectedOffering.title}' for the request '${selectedRequest.title}'. Token cost: ${selectedRequest.tokenCost}`);
    toast({
      title: "Proposal Sent (Mock)!",
      description: `Your offer of "${selectedOffering.title}" has been sent for "${selectedRequest.title}".`,
    });
    
    handleProposalDialogClose();
  }, [selectedOffering, selectedRequest, toast, handleProposalDialogClose]);

  const handleRetry = useCallback(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    isProposalDialogOpen,
    selectedRequest,
    selectedOffering,
    handleProposalDialogOpen,
    handleProposalDialogClose,
    handleSelectOffering,
    handleSendProposal,
    handleRetry,
  };
}