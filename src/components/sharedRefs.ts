import { ref, useTemplateRef } from "vue";
import type { AudioChunk } from "src/types";

/* -------------- */
/* --- Player --- */
/* -------------- */
export const srcPath = ref<string>("");
export const currentTime = ref<number>(0);
export const chunk = ref<AudioChunk | undefined>(undefined);

/* --------------- */
/* --- Comment --- */
/* --------------- */
export const commentInput = ref<HTMLInputElement | null>(null);
export const editedCommentTime = ref<number | null>(null);
export const contentCommentInput = ref<string>(); // Content of input-box WHEN creating/modififing comment

/* -------------- */
/* --- States --- */
/* -------------- */
export const playerLayout = ref(""); // What player size we want
export const isSticky = ref<boolean>(false); // IF we enable the player to be sticky
export const isDuplicate = ref<boolean>(false); // WHEN we want to create a comment WHERE it already exists
export const deleteConfirmation = ref<boolean>(false); // IF the user confirm he wants to delete the comment
export const editMode = ref<boolean>(false);
export const isCommentInputShown = ref<boolean>(false); // IF the input-box for a comment is displayed
export const isCached = ref<boolean>(false); // IF we can used the chached value CAUSE the we are dealing with the same obj
