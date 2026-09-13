<template>
  <div class="relative color-picker-container" ref="colorPickerContainer">
    <!-- 颜色显示按钮 -->
    <div
      class="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
      @click="togglePicker"
    >
      <div
        class="w-8 h-8 rounded border border-gray-300 dark:border-gray-600 flex-shrink-0"
        :style="{ backgroundColor: displayValue }"
      ></div>
      <input
        v-model="displayValue"
        type="text"
        @input="handleInput"
        @blur="handleBlur"
        @click.stop
        class="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
        placeholder="#000000"
      />
    </div>

    <!-- 颜色选择器面板 -->
    <div
      v-if="showPicker"
      ref="pickerPanel"
      class="absolute z-50 bottom-full mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3"
      style="min-width: 300px"
    >
      <!-- 调色板 -->
      <div class="mb-4">
        <label
          class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          调色板
        </label>

        <!-- 饱和度和亮度选择区域 -->
        <div
          ref="saturationLightnessArea"
          class="relative w-full h-48 rounded-lg cursor-crosshair overflow-hidden mb-2 touch-none"
          :style="{
            background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h}, 100%, 50%))`,
          }"
          @mousedown="startDrag"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="stopDrag"
        >
          <!-- 选择器指示器 -->
          <div
            class="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
            :style="{
              left: `${hsv.s}%`,
              top: `${100 - hsv.v}%`,
            }"
          ></div>
        </div>

        <!-- 色相选择条 -->
        <div
          ref="hueSlider"
          class="relative w-full h-6 rounded-lg cursor-pointer overflow-hidden touch-none"
          :style="{
            background:
              'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
          }"
          @mousedown="startHueDrag"
          @touchstart="handleHueTouchStart"
          @touchmove="handleHueTouchMove"
          @touchend="stopDrag"
        >
          <!-- 色相指示器 -->
          <div
            class="absolute top-0 w-1 h-full border-l border-r border-white shadow-lg pointer-events-none transform -translate-x-1/2"
            :style="{
              left: `${(hsv.h / 360) * 100}%`,
            }"
          ></div>
        </div>
      </div>

      <!-- 预设颜色 -->
      <div class="mb-3">
        <label
          class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5"
        >
          预设颜色
        </label>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="preset in presetColors"
            :key="preset"
            type="button"
            @click="selectColor(preset)"
            class="w-6 h-6 rounded border-2 transition-all hover:scale-110 flex-shrink-0"
            :class="
              displayValue.toLowerCase() === preset.toLowerCase()
                ? 'border-primary-500 ring-1 ring-primary-300'
                : 'border-gray-300 dark:border-gray-600'
            "
            :style="{ backgroundColor: preset }"
            :title="preset"
          ></button>
        </div>
      </div>

      <!-- 颜色阶值选择器（如果启用） -->
      <div v-if="showShades" class="mb-4">
        <label
          class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          颜色阶值
        </label>
        <div class="grid grid-cols-5 gap-2">
          <button
            v-for="shade in colorShades"
            :key="shade.value"
            type="button"
            @click="selectColor(shade.value)"
            class="h-8 rounded border-2 transition-all hover:scale-105 text-xs"
            :class="
              displayValue.toLowerCase() === shade.value.toLowerCase()
                ? 'border-primary-500 ring-2 ring-primary-300'
                : 'border-gray-300 dark:border-gray-600'
            "
            :style="{ backgroundColor: shade.value }"
            :title="`${shade.label}: ${shade.value}`"
          >
            <span
              class="px-1"
              :class="
                getContrastColor(shade.value) === 'white'
                  ? 'text-white'
                  : 'text-gray-900'
              "
            >
              {{ shade.label }}
            </span>
          </button>
        </div>
      </div>

      <!-- 原生颜色选择器 -->
      <div class="mb-4">
        <label
          class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          自定义颜色
        </label>
        <div class="flex items-center gap-2">
          <input
            v-model="displayValue"
            type="color"
            @input="handleColorInput"
            class="w-full h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
          />
        </div>
      </div>

      <!-- RGB/HSL 输入 -->
      <div class="space-y-2">
        <div class="grid grid-cols-3 gap-2">
          <div>
            <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1"
              >R</label
            >
            <input
              v-model.number="rgb.r"
              type="number"
              min="0"
              max="255"
              @input="updateFromRgb"
              class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1"
              >G</label
            >
            <input
              v-model.number="rgb.g"
              type="number"
              min="0"
              max="255"
              @input="updateFromRgb"
              class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1"
              >B</label
            >
            <input
              v-model.number="rgb.b"
              type="number"
              min="0"
              max="255"
              @input="updateFromRgb"
              class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onUnmounted } from "vue";

interface Props {
  modelValue: string;
  showShades?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showShades: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const showPicker = ref(false);
const displayValue = ref(props.modelValue);
const pickerPanel = ref<HTMLElement | null>(null);
const colorPickerContainer = ref<HTMLElement | null>(null);

// 全局管理所有打开的 ColorPicker 实例
const openColorPickers = new Set<() => void>();

// 切换调色板显示
const togglePicker = (event?: Event) => {
  if (event) {
    event.stopPropagation();
  }

  if (!showPicker.value) {
    // 关闭所有其他打开的 ColorPicker
    openColorPickers.forEach((closeFn) => {
      if (closeFn !== closePicker) {
        closeFn();
      }
    });
    // 打开当前 ColorPicker
    showPicker.value = true;
    openColorPickers.add(closePicker);
  } else {
    // 关闭当前 ColorPicker
    closePicker();
  }
};

// 关闭当前 ColorPicker 的函数
const closePicker = () => {
  showPicker.value = false;
  openColorPickers.delete(closePicker);
};

// HSV 颜色值
const hsv = ref({ h: 0, s: 100, v: 100 });

// 拖拽状态
const isDragging = ref(false);
const isDraggingHue = ref(false);
const saturationLightnessArea = ref<HTMLElement | null>(null);
const hueSlider = ref<HTMLElement | null>(null);

// 预设颜色（精简为常用颜色）
const presetColors = [
  "#000000", // 黑色
  "#FFFFFF", // 白色
  "#EF4444", // 红色
  "#3B82F6", // 蓝色
  "#10B981", // 绿色
  "#F59E0B", // 橙色
  "#8B5CF6", // 紫色
  "#EC4899", // 粉色
];

// 颜色阶值（50-950）
const colorShades = computed(() => {
  if (!props.showShades || !displayValue.value) return [];

  // 从当前颜色生成阶值（简化版，实际应该基于颜色理论生成）
  const baseColor = hexToRgb(displayValue.value);
  if (!baseColor) return [];

  const shades = [
    { label: "50", value: lightenColor(baseColor, 0.9) },
    { label: "100", value: lightenColor(baseColor, 0.7) },
    { label: "500", value: rgbToHex(baseColor) },
    { label: "700", value: darkenColor(baseColor, 0.3) },
    { label: "900", value: darkenColor(baseColor, 0.6) },
  ];

  return shades;
});

const rgb = ref({ r: 0, g: 0, b: 0 });

// HSV 转 RGB
const hsvToRgb = (
  h: number,
  s: number,
  v: number
): { r: number; g: number; b: number } => {
  s = s / 100;
  v = v / 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0,
    g = 0,
    b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
};

// RGB 转 HSV
const rgbToHsv = (
  r: number,
  g: number,
  b: number
): { h: number; s: number; v: number } => {
  r = r / 255;
  g = g / 255;
  b = b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff) % 6;
    } else if (max === g) {
      h = (b - r) / diff + 2;
    } else {
      h = (r - g) / diff + 4;
    }
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : Math.round((diff / max) * 100);
  const v = Math.round(max * 100);

  return { h, s, v };
};

// 更新 HSV 从当前颜色
const updateHsvFromHex = (hex: string) => {
  const rgbValue = hexToRgb(hex);
  if (rgbValue) {
    hsv.value = rgbToHsv(rgbValue.r, rgbValue.g, rgbValue.b);
  }
};

// 从 HSV 更新颜色
const updateColorFromHsv = () => {
  const rgbValue = hsvToRgb(hsv.value.h, hsv.value.s, hsv.value.v);
  rgb.value = rgbValue;
  const hex = rgbToHex(rgbValue);
  displayValue.value = hex;
  emit("update:modelValue", hex);
};

// 全局鼠标事件处理函数
let globalMouseMoveHandler: ((e: MouseEvent) => void) | null = null;
let globalMouseUpHandler: ((e: MouseEvent) => void) | null = null;

// 拖拽处理
const startDrag = (event: MouseEvent) => {
  event.preventDefault();
  isDragging.value = true;
  updateSaturationLightness(event);

  // 添加全局事件监听器
  globalMouseMoveHandler = (e: MouseEvent) => {
    if (isDragging.value) {
      updateSaturationLightness(e);
    }
  };
  globalMouseUpHandler = () => {
    stopDrag();
  };

  document.addEventListener("mousemove", globalMouseMoveHandler);
  document.addEventListener("mouseup", globalMouseUpHandler);
};

const startHueDrag = (event: MouseEvent) => {
  event.preventDefault();
  isDraggingHue.value = true;
  updateHue(event);

  // 添加全局事件监听器
  globalMouseMoveHandler = (e: MouseEvent) => {
    if (isDraggingHue.value) {
      updateHue(e);
    }
  };
  globalMouseUpHandler = () => {
    stopDrag();
  };

  document.addEventListener("mousemove", globalMouseMoveHandler);
  document.addEventListener("mouseup", globalMouseUpHandler);
};

const stopDrag = () => {
  isDragging.value = false;
  isDraggingHue.value = false;

  // 移除全局事件监听器
  if (globalMouseMoveHandler) {
    document.removeEventListener("mousemove", globalMouseMoveHandler);
    globalMouseMoveHandler = null;
  }
  if (globalMouseUpHandler) {
    document.removeEventListener("mouseup", globalMouseUpHandler);
    globalMouseUpHandler = null;
  }
};

const updateSaturationLightness = (event: MouseEvent | TouchEvent) => {
  if (!saturationLightnessArea.value) return;
  const rect = saturationLightnessArea.value.getBoundingClientRect();
  const clientX =
    "touches" in event ? event.touches[0]?.clientX ?? 0 : event.clientX;
  const clientY =
    "touches" in event ? event.touches[0]?.clientY ?? 0 : event.clientY;
  const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
  const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

  hsv.value.s = Math.round((x / rect.width) * 100);
  hsv.value.v = Math.round(100 - (y / rect.height) * 100);
  updateColorFromHsv();
};

const updateHue = (event: MouseEvent | TouchEvent) => {
  if (!hueSlider.value) return;
  const rect = hueSlider.value.getBoundingClientRect();
  const clientX =
    "touches" in event ? event.touches[0]?.clientX ?? 0 : event.clientX;
  const x = Math.max(0, Math.min(rect.width, clientX - rect.left));

  hsv.value.h = Math.round((x / rect.width) * 360);
  updateColorFromHsv();
};

// 触摸事件处理（使用 passive: false 来允许 preventDefault）
const handleTouchStart = (event: TouchEvent) => {
  event.preventDefault();
  isDragging.value = true;
  updateSaturationLightness(event);
};

const handleTouchMove = (event: TouchEvent) => {
  if (isDragging.value) {
    event.preventDefault();
    updateSaturationLightness(event);
  }
};

const handleHueTouchStart = (event: TouchEvent) => {
  event.preventDefault();
  isDraggingHue.value = true;
  updateHue(event);
};

const handleHueTouchMove = (event: TouchEvent) => {
  if (isDraggingHue.value) {
    event.preventDefault();
    updateHue(event);
  }
};

// 辅助函数：先定义，后使用
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result || !result[1] || !result[2] || !result[3]) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
};

const updateRgbFromHex = (hex: string) => {
  const rgbValue = hexToRgb(hex);
  if (rgbValue) {
    rgb.value = rgbValue;
    updateHsvFromHex(hex);
  }
};

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  (newValue) => {
    displayValue.value = newValue;
    updateRgbFromHex(newValue);
  },
  { immediate: true }
);

// 监听 displayValue 变化
watch(displayValue, (newValue) => {
  if (/^#[0-9A-Fa-f]{6}$/i.test(newValue)) {
    updateRgbFromHex(newValue);
  }
});

const rgbToHex = (rgb: { r: number; g: number; b: number }): string => {
  return (
    "#" +
    [rgb.r, rgb.g, rgb.b]
      .map((x) => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
};

const lightenColor = (
  rgb: { r: number; g: number; b: number },
  factor: number
): string => {
  return rgbToHex({
    r: Math.min(255, rgb.r + (255 - rgb.r) * factor),
    g: Math.min(255, rgb.g + (255 - rgb.g) * factor),
    b: Math.min(255, rgb.b + (255 - rgb.b) * factor),
  });
};

const darkenColor = (
  rgb: { r: number; g: number; b: number },
  factor: number
): string => {
  return rgbToHex({
    r: Math.max(0, rgb.r * (1 - factor)),
    g: Math.max(0, rgb.g * (1 - factor)),
    b: Math.max(0, rgb.b * (1 - factor)),
  });
};

const getContrastColor = (hex: string): string => {
  const rgbValue = hexToRgb(hex);
  if (!rgbValue) return "black";
  const brightness =
    (rgbValue.r * 299 + rgbValue.g * 587 + rgbValue.b * 114) / 1000;
  return brightness > 128 ? "black" : "white";
};

const selectColor = (color: string) => {
  displayValue.value = color;
  emit("update:modelValue", color);
  closePicker();
};

const handleInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
    emit("update:modelValue", value);
  }
};

const handleBlur = () => {
  // 验证并格式化颜色值
  if (!/^#[0-9A-Fa-f]{6}$/.test(displayValue.value)) {
    // 尝试修复格式
    const cleaned = displayValue.value.replace(/[^0-9A-Fa-f]/g, "");
    if (cleaned.length === 6) {
      displayValue.value = "#" + cleaned;
      emit("update:modelValue", displayValue.value);
    } else {
      displayValue.value = props.modelValue; // 恢复原值
    }
  }
};

const handleColorInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  displayValue.value = value;
  emit("update:modelValue", value);
};

const updateFromRgb = () => {
  const hex = rgbToHex(rgb.value);
  displayValue.value = hex;
  hsv.value = rgbToHsv(rgb.value.r, rgb.value.g, rgb.value.b);
  emit("update:modelValue", hex);
};

// 点击外部关闭调色板
let clickOutsideHandler: ((e: MouseEvent) => void) | null = null;

watch(showPicker, (isOpen) => {
  if (isOpen) {
    // 延迟添加监听器，避免立即触发
    setTimeout(() => {
      clickOutsideHandler = (event: MouseEvent) => {
        const target = event.target as HTMLElement;

        // 检查点击是否在当前 ColorPicker 组件内部
        if (
          colorPickerContainer.value &&
          colorPickerContainer.value.contains(target)
        ) {
          return; // 点击在组件内部，不关闭
        }

        // 检查点击是否在其他 ColorPicker 组件内部
        const allColorPickerContainers = document.querySelectorAll(
          ".color-picker-container"
        );
        let clickedInsideAnotherPicker = false;
        allColorPickerContainers.forEach((container) => {
          if (
            container !== colorPickerContainer.value &&
            container.contains(target)
          ) {
            clickedInsideAnotherPicker = true;
          }
        });

        // 如果点击在其他 ColorPicker 内部，不关闭（让那个 ColorPicker 自己处理）
        if (clickedInsideAnotherPicker) {
          return;
        }

        // 点击在外部，关闭当前 ColorPicker
        closePicker();
      };
      document.addEventListener("click", clickOutsideHandler, true);
    }, 0);
  } else {
    if (clickOutsideHandler) {
      document.removeEventListener("click", clickOutsideHandler, true);
      clickOutsideHandler = null;
    }
  }
});

// 组件卸载时清理事件监听器
onUnmounted(() => {
  stopDrag();
  if (clickOutsideHandler) {
    document.removeEventListener("click", clickOutsideHandler, true);
  }
  // 从全局集合中移除
  openColorPickers.delete(closePicker);
});
</script>
