# Code Style Guide

This guide describes the coding style expected in this repository.

The short version:

- write code for humans first
- optimize for first-read understanding
- prefer boring code over clever code
- names should describe the workflow, not the implementation trick
- comments should explain why something exists, not restate syntax
- if a helper does not clearly improve readability, do not create it

## Core Principles

### 1. Readability beats cleverness

Code should be easy to understand without tracing half the codebase.

Preferred when the longer version really helps:

```ts
const hasUnsavedMetadataChanges =
  normalizedDraft.name !== normalizedLastSavedDraft.name ||
  normalizedDraft.description !== normalizedLastSavedDraft.description;
```

Also acceptable:

```ts
const isDirtyMetadata =
  normalizedDraft.name !== normalizedLastSavedDraft.name ||
  normalizedDraft.description !== normalizedLastSavedDraft.description;
```

Why this matters:

- choose the version that is clearest in the current file
- the longer name is not automatically better if it makes the code heavier

Bad only when it becomes too vague or overloaded in the current context.

### 2. Prefer workflow names over implementation names

Names should describe what happens in the product flow.

Good:

```ts
addImageToPendingUploads;
deleteImageFromPendingUploads;
saveMetadataDraft;
useCreateNewContext;
```

Bad:

```ts
withUploadingHash;
withoutUploadingHash;
handleManualCreate;
```

Sometimes good:

```ts
handleSave;
```

Why bad:

- describes low-level mechanics instead of business meaning
- sounds like helper-gymnastics, not product logic
- `handleSave` is fine when the function really is just a save handler

### 3. Keep ownership obvious

A file should make it clear what it owns.

- hooks should own one clear workflow
- components should mostly compose UI and callbacks
- long-running jobs should not hide inside leaf components unless that ownership is truly intended

If a reader asks "who owns this state?" or "who is responsible for this side effect?", the file is not clear enough.

### 4. Fewer layers are better

Do not add wrappers just to rename something or silence tooling.

Bad:

```ts
const handleCreateContext = useCallback(async () => {
  // real work
}, [deps]);

const createContext = useCallback(() => {
  void handleCreateContext();
}, [handleCreateContext]);

return { createContext };
```

Why bad:

- second callback adds no real value
- creates extra naming and reading overhead
- `void` is noise here

Better:

```ts
const createContext = useCallback(async () => {
  // real work
}, [deps]);

return createContext;
```

### 5. Do not hide simple conditions behind fake abstractions

If a condition is simple and only used in one place, keep it inline.

Bad:

```ts
function canCreateDerivedImage(
  model: ModelDTO | undefined,
  context: Context | undefined,
  isGenerating: boolean | undefined
) {
  return (Boolean(model) || Boolean(context)) && !isGenerating;
}
```

Used like:

```ts
if (!canCreateDerivedImage(model, context, isGenerating)) {
  return;
}
```

Why bad:

- hides a tiny condition behind a grand helper name
- forces the reader to jump away from the actual logic

Better:

```ts
// Allow derived images for both model and context sessions.
if ((!model && !context) || isGenerating) {
  return;
}
```

### 6. Comments should explain why, not narrate obvious code

Good:

```ts
// Only create the real context once the name is valid and all staged uploads have finished.
if (!isNameValid || uploadingImagesCount > 0) {
  return;
}
```

Bad:

```ts
// Set the name in state.
setDraft((currentDraft) => ({
  ...currentDraft,
  name: event.currentTarget.value
}));
```

Why bad:

- the code already says that

Also bad:

```ts
/** Renders the editable context view and coordinates metadata, images, and delete actions. */
export const EditContext = () => {
```

Why bad:

- obvious component names do not need fluff
- comment adds no real insight

### 6.1 Give `useEffect` blocks a short comment

`useEffect` starts a side effect immediately, so unlike a named variable or callback it does not explain itself.

Good:

```ts
// Reuse existing object URLs, create new ones for new files, and revoke URLs for removed files.
useEffect(() => {
  ...
}, [files]);
```

```ts
// Reset the local attach queue when this hook starts managing a different saved context.
useEffect(() => {
  ...
}, [attachContextImages]);
```

Bad:

```ts
useEffect(() => {
  ...
}, [files]);
```

Why bad:

- the reader has to scan the whole effect before knowing its job
- effects often own cleanup, subscriptions, debounce timers, and async work, so hidden intent is expensive here

Rule:

- almost every `useEffect` should have a short comment right above it
- describe the effect's job and ownership boundary, not the syntax inside it
- skip the comment only when the effect is truly trivial and obvious on first read

### 7. JSDoc is good when it helps orientation

Use one-line JSDoc for non-trivial hooks, helpers, or components.

Good:

```ts
/** Builds one draft snapshot from context data so draft state always starts from the server shape. */
function createDraftFromContext(context: Context): MetadataDraft {
```

Bad:

```ts
/** This component shows the edit context screen. */
export const EditContext = () => {
```

Rule:

- add JSDoc when it helps a reader orient quickly
- skip it when the name is already obvious

### 8. Use simple words

Prefer words a tired engineer understands instantly.

Prefer:

- `searchPhrase`
- `errorMessage`
- `selectedFileCount`
- `pendingS3KeysToAttach`
- `hasUnsavedMetadataChanges`

Avoid:

- `searchQuery` when `query` already means many other things in the file/app
- `notifyingError`
- `countFileSelection`
- `isDirtyMetadata`
- `handleXxx` unless it is truly just a UI event handler

### 8.1 Use names that sound like real English

If a name feels awkward when you say it out loud, it is probably bad.

Good:

```ts
clearPendingAttachmentS3Keys;
pendingS3KeysToAttach;
removeImageFromBucket;
```

Bad:

```ts
clearPendingAttachS3Keys;
finishPendingAttach;
pendingAttachS3Keys;
```

Why bad:

- `attach` is being forced into a noun-like role where normal English would use `attachment`
- the reader has to mentally repair the phrase before understanding it
- awkward grammar makes an otherwise simple workflow harder to scan and trust

Rule:

- prefer names you could say in a normal sentence
- if you mean the action, use a verb phrase like `attachImages`
- if you mean the thing waiting for that action, use a noun phrase like `pendingAttachmentS3Keys`

Examples:

```ts
// Good: clears S3 keys that are still waiting for attachment.
clearPendingAttachmentS3Keys;

// Bad: not a natural phrase in English.
clearPendingAttachS3Keys;
```

### 9. Do not create helpers that only move syntax around

Bad:

```ts
const updateScopedImageBucket = useCallback(
  (updater) => {
    updateImageBucket(scopeKey, updater);
  },
  [scopeKey, updateImageBucket]
);
```

Why bad:

- adds a new concept with almost no readability benefit

Better:

```ts
updateImageBucket(scopeKey, clearImageBucket);
```

### 10. Tests should read like business scenarios

Tests should explain product behavior, not framework plumbing.

Good:

```ts
it('waits for uploads to finish before auto-creating the real context', async () => {
```

Bad:

```ts
it('calls mutateAsync after rerender and timers', async () => {
```

Why bad:

- describes implementation details, not business behavior

Also:

- avoid rewriting large test files during readability cleanups unless behavior actually changes
- test changes should be minimal, focused, and easy to review

## Naming Rules

### Prefer these patterns when they match the real workflow

- `saveMetadataDraft`
- `clearStagedImages`
- `removeStagedImage`
- `addImageToPendingUploads`
- `deleteImageFromPendingUploads`
- `useCreateNewContext`
- `useCreateImageHandler`
- `countSelectedFiles`

### Avoid these patterns

- `handleXxx` for business actions
- `withXxx` / `withoutXxx` for user-facing workflow logic when they hide a simple action
- `countFileSelection`
- `notifyingError`
- names that describe the data structure instead of the meaning

Bad:

```ts
withUploadingHash;
withoutUploadingHash;
useNewContextCreation;
useImageCreationSubmit;
```

Better:

```ts
addImageToPendingUploads;
deleteImageFromPendingUploads;
useCreateNewContext;
useCreateImageHandler;
```

## Types

### Use existing inferred API types when they clearly reduce code

Do not duplicate backend types just because it feels safer.

But also:

- do not force inferred types everywhere if they make the file noisier
- use local shapes only when they clearly make the code shorter and easier to read

If local API shapes stay, add one short comment explaining why.

Good:

```ts
// Keep these local API shapes while they make the file easier to read.
interface ApiContext {
```

### Prefer domain names when they really improve meaning

Acceptable:

```ts
type DraftState = {
  name: string;
  description: string;
};
```

Also acceptable when the draft meaning needs to be more specific:

```ts
interface MetadataDraft {
  name: string;
  description: string;
}
```

Rule:

- `DraftState` is fine when the file clearly talks about one draft
- a more specific name is useful only when it actually reduces ambiguity
- do not rename to something narrower if the data is not really that narrow

## Comments We Do Want

Use short comments for:

- guards with business meaning
- race-condition prevention
- debounce / retry / reset logic
- state ownership boundaries

Good:

```ts
// Clear the request so it does not keep overriding later picker changes.
setPreselectedModelId(undefined);
```

```ts
// Mark as processed first so rerenders do not queue the same file twice.
processedFilesRef.current.add(hash);
```

## Comments We Do Not Want

Do not add comments for:

- obvious component purpose
- obvious setter calls
- JSX that already names itself
- things already clear from the function name

Bad:

```ts
// Opens the sidebar.
setIsSidebarOpen(true);
```

Bad:

```ts
/** Renders the new context component. */
export const NewContext = () => {
```

## Litmus Test Before Finishing

Before you finish a file, ask:

- Is this pleasant to look at?
- Would a tired engineer understand it on first read?
- Does every helper clearly pay rent?
- Do names describe the workflow, not the implementation trick?
- Did I add any wrapper, callback, comment, or type just to silence tooling or satisfy my own taste?
- If I removed one abstraction, would the file get simpler?

If the answer is yes, remove it.

## Final Rule

The code is for humans.

Not for cleverness.
Not for symmetry.
Not for showing that you know patterns.

The code should still lint.
But do not add wrappers, casts, or noise just to silence tooling when the real fix is to simplify the code.

If a reader has to stop and decode your naming or helper structure, the code is not done.
