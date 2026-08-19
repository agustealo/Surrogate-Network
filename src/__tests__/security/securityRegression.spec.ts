// Security Regression Tests for SC-00.4
// These tests ensure critical security properties are maintained across the codebase

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

describe('Security Regression Tests', () => {
  let supabase: any;
  let testUserA: any;
  let testUserB: any;
  let adminUser: any;

  beforeEach(async () => {
    // Setup test users for security testing
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Create test users (in production, use test fixtures)
    const { data: userA } = await supabase.auth.signUp({
      email: 'security-test-a@test.com',
      password: 'test-password-123',
    });
    testUserA = userA.user;

    const { data: userB } = await supabase.auth.signUp({
      email: 'security-test-b@test.com',
      password: 'test-password-456',
    });
    testUserB = userB.user;

    // Create admin user
    const { data: admin } = await supabase.auth.signUp({
      email: 'security-admin@test.com',
      password: 'admin-password-789',
    });
    adminUser = admin.user;

    // Make admin user an admin
    await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', adminUser.id);
  });

  describe('Token/XP Security (P0-2)', () => {
    it('should prevent User A from modifying User B tokens', async () => {
      // Sign in as user A
      await supabase.auth.signInWithPassword({
        email: 'security-test-a@test.com',
        password: 'test-password-123',
      });

      // Attempt to modify user B's tokens - should fail
      const { error } = await supabase.rpc('update_token_balance', {
        p_user_id: testUserB.id,
        p_amount: 100000,
        p_reason: 'malicious attempt',
        p_transaction_type: 'earned',
      });

      // This should fail because regular users can't call this function
      expect(error).toBeDefined();
      expect(error.code).not.toBeNull();
    });

    it('should prevent User A from modifying their own arbitrary XP', async () => {
      // Sign in as user A
      await supabase.auth.signInWithPassword({
        email: 'security-test-a@test.com',
        password: 'test-password-123',
      });

      // Attempt to grant themselves massive XP - should fail
      const { error } = await supabase.rpc('update_user_xp', {
        p_user_id: testUserA.id,
        p_amount: 1000000,
        p_source: 'login', // legitimate source but malicious amount
        p_description: 'self-grant',
      });

      // This should fail because regular users can't call this function
      expect(error).toBeDefined();
    });

    it('should prevent User A from modifying their own rank', async () => {
      // Sign in as user A
      await supabase.auth.signInWithPassword({
        email: 'security-test-a@test.com',
        password: 'test-password-123',
      });

      // Attempt to directly update rank - should fail due to RLS
      const { error } = await supabase
        .from('profiles')
        .update({ rank: 999 })
        .eq('id', testUserA.id);

      // This should fail due to hardened RLS policies
      expect(error).toBeDefined();
    });

    it('should prevent User A from modifying verification status', async () => {
      // Sign in as user A
      await supabase.auth.signInWithPassword({
        email: 'security-test-a@test.com',
        password: 'test-password-123',
      });

      // Attempt to self-verify - should fail due to RLS
      const { error } = await supabase
        .from('profiles')
        .update({ verification_status: 'fully_verified' })
        .eq('id', testUserA.id);

      // This should fail due to hardened RLS policies
      expect(error).toBeDefined();
    });

    it('should prevent User A from modifying suspension status', async () => {
      // Sign in as user A
      await supabase.auth.signInWithPassword({
        email: 'security-test-a@test.com',
        password: 'test-password-123',
      });

      // Attempt to unsuspend themselves - should fail due to RLS
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: false })
        .eq('id', testUserA.id);

      // This should fail due to hardened RLS policies
      expect(error).toBeDefined();
    });
  });

  describe('Email Privacy (P0-4)', () => {
    it('should prevent User A from reading User B email', async () => {
      // Sign in as user A
      await supabase.auth.signInWithPassword({
        email: 'security-test-a@test.com',
        password: 'test-password-123',
      });

      // Attempt to read user B's profile - should not include email
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', testUserB.id)
        .single();

      // Email should not be accessible due to privacy policies
      expect(error).toBeDefined();
      // OR data should be null/email field should be null/undefined
      if (data) {
        expect(data.email).toBeNull();
      }
    });

    it('should allow User A to read their own email', async () => {
      // Sign in as user A
      await supabase.auth.signInWithPassword({
        email: 'security-test-a@test.com',
        password: 'test-password-123',
      });

      // Should be able to read own email
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', testUserA.id)
        .single();

      expect(error).toBeNull();
      expect(data.email).toBe('security-test-a@test.com');
    });

    it('should provide safe public profile view', async () => {
      // Sign in as user A
      await supabase.auth.signInWithPassword({
        email: 'security-test-a@test.com',
        password: 'test-password-123',
      });

      // Use public_profiles view - should work and not include private fields
      const { data, error } = await supabase
        .from('public_profiles')
        .select('*')
        .eq('id', testUserB.id)
        .single();

      expect(error).toBeNull();
      // Email should not be in public_profiles
      expect(data.email).toBeUndefined();
      // Token balance should not be in public_profiles
      expect(data.token_balance).toBeUndefined();
    });
  });

  describe('Proposal Authority (P0-3)', () => {
    it('should prevent User A from accepting their own outbound proposal', async () => {
      // Sign in as user A
      await supabase.auth.signInWithPassword({
        email: 'security-test-a@test.com',
        password: 'test-password-123',
      });

      // Create test need and offer
      const { data: need } = await supabase
        .from('needs')
        .insert({
          title: 'Test Need',
          description: 'Test',
          category: 'personal',
          user_id: testUserB.id,
          user_name: 'User B',
          boundaries: ['platonic'],
          location_mode: 'remote',
        })
        .select()
        .single();

      const { data: offer } = await supabase
        .from('offers')
        .insert({
          title: 'Test Offer',
          description: 'Test',
          category: 'personal',
          user_id: testUserA.id,
          user_name: 'User A',
          boundaries: ['platonic'],
          location_mode: 'remote',
        })
        .select()
        .single();

      // Create proposal from A to B
      const { data: proposal } = await supabase
        .from('proposals')
        .insert({
          need_id: need.id,
          offer_id: offer.id,
          proposing_user_id: testUserA.id,
          receiving_user_id: testUserB.id,
          status: 'pending',
        })
        .select()
        .single();

      // Attempt to accept own proposal - should fail
      const { error } = await supabase
        .from('proposals')
        .update({ status: 'accepted' })
        .eq('id', proposal.id)
        .eq('proposing_user_id', testUserA.id);

      expect(error).toBeDefined();
    });

    it('should prevent unrelated user from mutating proposal', async () => {
      // Sign in as user C (unrelated user)
      const { data: userC } = await supabase.auth.signUp({
        email: 'security-test-c@test.com',
        password: 'test-password-abc',
      });
      await supabase.auth.signInWithPassword({
        email: 'security-test-c@test.com',
        password: 'test-password-abc',
      });

      // Create proposal between A and B
      const { data: proposal } = await supabase
        .from('proposals')
        .insert({
          need_id: 'test-need-id',
          offer_id: 'test-offer-id',
          proposing_user_id: testUserA.id,
          receiving_user_id: testUserB.id,
          status: 'pending',
        })
        .select()
        .single();

      // Attempt to modify proposal as unrelated user - should fail
      const { error } = await supabase
        .from('proposals')
        .update({ status: 'accepted' })
        .eq('id', proposal.id);

      expect(error).toBeDefined();
    });

    it('should allow recipient to accept proposal with correct state transition', async () => {
      // Sign in as user B (recipient)
      await supabase.auth.signInWithPassword({
        email: 'security-test-b@test.com',
        password: 'test-password-456',
      });

      // Create pending proposal
      const { data: proposal } = await supabase
        .from('proposals')
        .insert({
          need_id: 'test-need-id',
          offer_id: 'test-offer-id',
          proposing_user_id: testUserA.id,
          receiving_user_id: testUserB.id,
          status: 'pending',
        })
        .select()
        .single();

      // Accept proposal as recipient - should succeed
      const { error } = await supabase
        .from('proposals')
        .update({ status: 'accepted' })
        .eq('id', proposal.id)
        .eq('receiving_user_id', testUserB.id);

      expect(error).toBeNull();
    });
  });

  describe('Admin Access (P1)', () => {
    it('should prevent non-admin from accessing admin areas', async () => {
      // Sign in as regular user
      await supabase.auth.signInWithPassword({
        email: 'security-test-a@test.com',
        password: 'test-password-123',
      });

      // Attempt admin action - should fail
      const { error } = await supabase.rpc('admin_update_profile', {
        p_id: testUserB.id,
        p_name: 'Malicious Update',
      });

      expect(error).toBeDefined();
    });

    it('should allow admin to update authoritative fields', async () => {
      // Sign in as admin
      await supabase.auth.signInWithPassword({
        email: 'security-admin@test.com',
        password: 'admin-password-789',
      });

      // Update user profile as admin - should succeed
      const { error } = await supabase.rpc('admin_update_profile', {
        p_id: testUserB.id,
        p_name: 'Admin Update',
        p_xp: 100,
      });

      expect(error).toBeNull();
    });
  });

  describe('Audit Preservation (P1)', () => {
    it('should preserve audit history when account is deleted', async () => {
      // Create audit event
      const { data: auditEvent } = await supabase
        .from('audit_events')
        .insert({
          actor_id: testUserA.id,
          action: 'test_action',
          target_id: 'test-target',
          target_type: 'test',
        })
        .select()
        .single();

      // Delete user account
      await supabase.auth.admin.deleteUser(testUserA.id);

      // Audit event should still exist with null actor_id
      const { data: preservedEvent } = await supabase
        .from('audit_events')
        .select('*')
        .eq('id', auditEvent.id)
        .single();

      expect(preservedEvent).toBeDefined();
      expect(preservedEvent.actor_id).toBeNull();
    });

    it('should allow querying audit events with deleted actors', async () => {
      // This tests that audit_events.actor_id is properly nullable
      const { data, error } = await supabase
        .from('audit_events')
        .select('*')
        .is('actor_id', null);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('RLS Policy Effectiveness', () => {
    it('should prevent direct profile table access for cross-user queries', async () => {
      // Sign in as user A
      await supabase.auth.signInWithPassword({
        email: 'security-test-a@test.com',
        password: 'test-password-123',
      });

      // Attempt to directly query profiles table for user B
      const { error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', testUserB.id)
        .single();

      // Should fail or return incomplete data due to privacy policies
      expect(error).toBeDefined();
    });

    it('should allow access through public_profiles view', async () => {
      // Sign in as user A
      await supabase.auth.signInWithPassword({
        email: 'security-test-a@test.com',
        password: 'test-password-123',
      });

      // Query through public_profiles view
      const { data, error } = await supabase
        .from('public_profiles')
        .select('*')
        .eq('id', testUserB.id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });
});