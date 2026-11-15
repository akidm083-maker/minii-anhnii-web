# Firestore Security Specification

## 1. Data Invariants
- Every document ID and UID field must match `^[a-zA-Z0-9_\-]+$` and be at most 128 characters.
- No PII (`email`, phone, address, school) may ever be written to public collections (`/guestbook` or `/users/{uid}/public`).
- `users/{uid}/private/info` can only be read or written by the authenticated verified owner (`request.auth.uid == uid`) or the verified portfolio admin (`akidm083@gmail.com`).
- `users/{uid}/nikoChats/{messageId}` can only be read, queried, created, or deleted by the authenticated verified owner whose `uid` matches both the path `{userId}` and `resource.data.userId`.
- `guestbook/{entryId}` is publicly readable, contains zero PII, and may only be created by verified signed-in users with `authorId == request.auth.uid` and `createdAt == request.time`. Only the author or admin may delete an entry.
- `contactMessages/{messageId}` may only be created by verified signed-in users with `status == 'new'`, `senderId == request.auth.uid`, and `createdAt == request.time && updatedAt == request.time`. Only the sender or admin may read/list (`resource.data.senderId == request.auth.uid || isAdmin()`). Only admin may mark `status` as `'read'`.

## 2. Dirty Dozen Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Guestbook Write**: Unauthenticated client creates `/guestbook/entry1` -> DENIED (`!isVerifiedUser()`).
2. **Unverified Email Write**: Signed-in user with `email_verified: false` creates `/guestbook/entry2` -> DENIED (`email_verified == true` required).
3. **Identity Spoofing in Guestbook**: User A creates `/guestbook/entry3` with `authorId: "userB"` -> DENIED (`authorId == request.auth.uid`).
4. **Shadow Field Injection**: User A creates `/guestbook/entry4` with extra field `isAdmin: true` -> DENIED (`keys().hasOnly(...)`).
5. **Resource Exhaustion / Oversized String**: User A creates `/guestbook/entry5` with 2000-char `message` -> DENIED (`message.size() <= 500`).
6. **ID Poisoning**: User A creates `/guestbook/bad$id..` -> DENIED (`isValidId(entryId)`).
7. **Timestamp Forgery**: User A creates `/contactMessages/msg1` with backdated `createdAt` (`!= request.time`) -> DENIED.
8. **State Shortcutting on Contact Message**: User A creates `/contactMessages/msg2` with `status: "read"` -> DENIED (`status == 'new'` required on create).
9. **Unauthorized Status Escalation**: Non-admin User A updates `/contactMessages/msg1` to `status: "read"` -> DENIED (only `isAdmin()` can mark read).
10. **Cross-User Private Read**: User B attempts `get` on `/users/userA/private/info` -> DENIED (`isOwner(userId)`).
11. **Cross-User Chat Hijack**: User B attempts `list` or `create` on `/users/userA/nikoChats` -> DENIED (`isOwner(userId)`).
12. **Admin Email Spoof without Verification**: Attacker with `email: "akidm083@gmail.com"` and `email_verified: false` attempts to list `/contactMessages` -> DENIED (`email_verified == true` enforced in `isAdmin()`).
