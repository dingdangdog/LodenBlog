<template>
  <div class="relative">
    <button
      type="button"
      @click="togglePicker"
      class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
      title="选择表情"
    >
      <FaceSmileIcon class="w-6 h-6" />
    </button>
    <div
      v-if="showPicker"
      class="absolute bottom-full left-0 mb-2 w-64 h-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 overflow-y-auto z-50"
    >
      <div class="grid grid-cols-8 gap-1">
        <button
          v-for="emoji in emojis"
          :key="emoji"
          @click="selectEmoji(emoji)"
          class="p-2 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          :title="emoji"
        >
          {{ emoji }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FaceSmileIcon } from "@heroicons/vue/24/outline";

const props = defineProps<{
  modelValue?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  select: [emoji: string];
}>();

const showPicker = computed({
  get: () => props.modelValue || false,
  set: (value) => emit("update:modelValue", value),
});

// 常用emoji列表
const emojis = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😅",
  "😂",
  "🤣",
  "😊",
  "😇",
  "🙂",
  "🙃",
  "😉",
  "😌",
  "😍",
  "🥰",
  "😘",
  "😗",
  "😙",
  "😚",
  "😋",
  "😛",
  "😝",
  "😜",
  "🤪",
  "🤨",
  "🧐",
  "🤓",
  "😎",
  "🤩",
  "🥳",
  "😏",
  "😒",
  "😞",
  "😔",
  "😟",
  "😕",
  "🙁",
  "😣",
  "😖",
  "😫",
  "😩",
  "🥺",
  "😢",
  "😭",
  "😤",
  "😠",
  "😡",
  "🤬",
  "🤯",
  "😳",
  "🥵",
  "🥶",
  "😱",
  "😨",
  "😰",
  "😥",
  "😓",
  "🤗",
  "🤔",
  "🤭",
  "🤫",
  "🤥",
  "😶",
  "😐",
  "😑",
  "😬",
  "🙄",
  "😯",
  "😦",
  "😧",
  "😮",
  "😲",
  "🥱",
  "😴",
  "🤤",
  "😪",
  "😵",
  "🤐",
  "🥴",
  "🤢",
  "🤮",
  "🤧",
  "😷",
  "🤒",
  "🤕",
  "🤑",
  "🤠",
  "👍",
  "👎",
  "👊",
  "✊",
  "🤛",
  "🤜",
  "🤞",
  "✌️",
  "🤟",
  "🤘",
  "👌",
  "🤏",
  "👈",
  "👉",
  "👆",
  "👇",
  "☝️",
  "👋",
  "🤚",
  "🖐",
  "✋",
  "🖖",
  "👏",
  "🙌",
  "🤲",
  "🤝",
  "🙏",
  "✍️",
  "💪",
  "🦾",
  "🦿",
  "🦵",
  "🦶",
  "👂",
  "🦻",
  "👃",
  "🧠",
  "🦷",
  "🦴",
  "👀",
  "👁",
  "👅",
  "👄",
  "💋",
  "💘",
  "💝",
  "💖",
  "💗",
  "💓",
  "💞",
  "💕",
  "💟",
  "❣️",
  "💔",
  "❤️",
  "🧡",
  "💛",
  "💚",
  "💙",
  "💜",
  "🖤",
  "🤍",
  "🤎",
  "💯",
  "💢",
  "💥",
  "💫",
  "💦",
  "💨",
  "🕳️",
  "💣",
  "💬",
  "👁️‍🗨️",
  "🗨️",
  "🗯️",
  "💭",
  "💤",
  "👋",
  "🤚",
  "🖐",
];

const togglePicker = () => {
  showPicker.value = !showPicker.value;
};

const selectEmoji = (emoji: string) => {
  emit("select", emoji);
  showPicker.value = false;
};

// 点击外部关闭
onMounted(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.closest(".relative")) {
      showPicker.value = false;
    }
  };
  document.addEventListener("click", handleClickOutside);
  onUnmounted(() => {
    document.removeEventListener("click", handleClickOutside);
  });
});
</script>
