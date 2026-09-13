<template>
  <div class="relative w-full" ref="selectContainer">
    <!-- 下拉选触发器 -->
    <button
      type="button"
      ref="triggerButton"
      :disabled="disabled"
      :class="[
        'w-full rounded-lg border px-3 py-2 text-sm text-left transition',
        'text-foreground',
        'border-border',
        'bg-transparent',
        'focus:outline-none focus:ring-1 focus:ring-primary-500',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        isOpen && 'ring-1 ring-primary-500',
      ]"
      @click="toggleDropdown"
      @keydown.enter.prevent="toggleDropdown"
      @keydown.space.prevent="toggleDropdown"
      @keydown.escape="closeDropdown"
      @keydown.arrow-down.prevent="openDropdown"
      @keydown.arrow-up.prevent="openDropdown"
    >
      <span
        :class="[
          'block truncate',
          hasValue && allowClear ? 'pr-8' : 'pr-6',
          !selectedOption && 'text-muted',
        ]"
      >
        {{ displayText }}
      </span>
      <span class="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
        <!-- 清空按钮 -->
        <button
          v-if="hasValue && allowClear"
          type="button"
          class="p-0.5 rounded hover:bg-surface-muted transition-colors"
          @click.stop="clearSelection"
          :disabled="disabled"
        >
          <XMarkIcon
            class="h-4 w-4 text-muted hover:text-foreground"
          />
        </button>
        <!-- 下拉箭头 -->
        <ChevronUpDownIcon
          v-else
          class="h-4 w-4 text-muted pointer-events-none"
          :class="isOpen && 'text-foreground'"
        />
      </span>
    </button>

    <!-- 下拉选项列表 -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        ref="dropdownMenu"
        :class="[
          'absolute z-50 w-full rounded-lg border border-border bg-surface text-foreground shadow-lg',
          dropdownPosition === 'top' ? 'mb-1 bottom-full' : 'mt-1 top-full',
        ]"
        @keydown.escape="closeDropdown"
        @keydown.arrow-down.prevent="navigateDown"
        @keydown.arrow-up.prevent="navigateUp"
        @keydown.enter.prevent="selectHighlighted"
      >
        <!-- 搜索输入框 -->
        <div
          v-if="searchable"
          class="p-2 border-b border-border"
          @click.stop
        >
          <div class="relative">
            <MagnifyingGlassIcon
              class="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted"
            />
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              class="w-full pl-8 pr-2 py-1.5 rounded border border-border bg-transparent text-sm text-foreground placeholder-muted focus:outline-none focus:ring-1 focus:ring-primary-500"
              :placeholder="$t('common.search')"
              @click.stop
              @keydown.escape="closeDropdown"
              @keydown.arrow-down.prevent="navigateDown"
              @keydown.arrow-up.prevent="navigateUp"
              @keydown.enter.prevent="selectHighlighted"
            />
          </div>
        </div>
        <ul
          class="py-1 text-sm max-h-60 overflow-auto"
          role="listbox"
        >
          <!-- 选项列表 -->
          <li
            v-for="(option, index) in filteredOptions"
            :key="`option-${index}-${getOptionValue(option) ?? 'null'}`"
            role="option"
            :aria-selected="isSelected(option)"
            :class="[
              'relative cursor-pointer select-none px-3 py-2',
              isSelected(option) && 'bg-primary-50 text-primary-600',
              !isSelected(option) &&
                'text-foreground hover:bg-surface-muted',
              highlightedIndex === index &&
                !isSelected(option) &&
                'bg-surface-muted',
            ]"
            @click="selectOption(option)"
            @mouseenter="highlightedIndex = index"
          >
            <span class="block truncate">
              {{ getOptionLabel(option) }}
            </span>
            <!-- 选中标记 -->
            <span
              v-if="isSelected(option)"
              class="absolute inset-y-0 right-0 flex items-center pr-3"
            >
              <CheckIcon
                class="h-4 w-4 text-primary-600"
              />
            </span>
          </li>

          <!-- 无选项提示 -->
          <li
            v-if="filteredOptions.length === 0"
            class="px-3 py-2 text-sm text-muted"
          >
            {{ searchQuery ? $t("common.noResults") : $t("common.noOptions") }}
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import {
  ChevronUpDownIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from "@heroicons/vue/24/outline";

export interface SelectOption {
  value: string | number | null;
  label: string;
  disabled?: boolean;
}

export interface Props {
  modelValue?: string | number | null;
  options?: SelectOption[] | Array<Record<string, any>>;
  optionValue?: string; // 当 options 是对象数组时，指定 value 字段名
  optionLabel?: string; // 当 options 是对象数组时，指定 label 字段名
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  allowClear?: boolean; // 是否允许清空选择
  placement?: "top" | "bottom"; // 下拉菜单弹出方向
  searchable?: boolean; // 是否启用搜索功能
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  options: () => [],
  optionValue: "value",
  optionLabel: "label",
  placeholder: "请选择",
  disabled: false,
  required: false,
  allowClear: true,
  placement: "bottom",
  searchable: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: string | number | null];
  change: [value: string | number | null];
}>();

const isOpen = ref(false);
const highlightedIndex = ref(-1);
const dropdownPosition = ref<"top" | "bottom">("bottom");
const selectContainer = ref<HTMLElement | null>(null);
const triggerButton = ref<HTMLButtonElement | null>(null);
const dropdownMenu = ref<HTMLElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);
const searchQuery = ref("");

// 获取选项的值
const getOptionValue = (
  option: SelectOption | Record<string, any>
): string | number | null => {
  if (typeof option === "object" && option !== null) {
    if ("value" in option) {
      return option.value;
    }
    return option[props.optionValue] ?? null;
  }
  return null;
};

// 获取选项的标签
const getOptionLabel = (option: SelectOption | Record<string, any>): string => {
  if (typeof option === "object" && option !== null) {
    if ("label" in option) {
      return option.label;
    }
    return option[props.optionLabel] ?? String(option[props.optionValue] ?? "");
  }
  return String(option);
};

// 判断选项是否被选中
const isSelected = (option: SelectOption | Record<string, any>): boolean => {
  const optionValue = getOptionValue(option);
  return props.modelValue === optionValue;
};

// 获取当前选中的选项
const selectedOption = computed(() => {
  if (props.modelValue === null || props.modelValue === "") {
    return null;
  }
  return (
    props.options.find((opt) => getOptionValue(opt) === props.modelValue) ||
    null
  );
});

// 显示文本
const displayText = computed(() => {
  if (props.modelValue === null || props.modelValue === "") {
    return props.placeholder;
  }
  if (selectedOption.value) {
    return getOptionLabel(selectedOption.value);
  }
  return props.placeholder;
});

// 是否有值
const hasValue = computed(() => {
  return props.modelValue !== null && props.modelValue !== "";
});

// 过滤后的选项列表
const filteredOptions = computed(() => {
  if (!props.searchable || !searchQuery.value.trim()) {
    return props.options;
  }
  const query = searchQuery.value.toLowerCase().trim();
  return props.options.filter((option) => {
    const label = getOptionLabel(option).toLowerCase();
    return label.includes(query);
  });
});

// 清空选择
const clearSelection = () => {
  if (props.disabled) return;
  emit("update:modelValue", null);
  emit("change", null);
};

// 更新下拉框位置
const updateDropdownPosition = () => {
  nextTick(() => {
    if (!triggerButton.value || !dropdownMenu.value) return;

    // 直接使用指定的 placement 值
    dropdownPosition.value = props.placement;
  });
};

// 切换下拉菜单
const toggleDropdown = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    searchQuery.value = ""; // 重置搜索
    highlightedIndex.value = 0;
    updateDropdownPosition();
    nextTick(() => {
      // 如果启用搜索，聚焦搜索框
      if (props.searchable && searchInputRef.value) {
        searchInputRef.value.focus();
      }
      // 滚动到选中项
      if (selectedOption.value) {
        const selectedIndex = filteredOptions.value.findIndex(
          (opt) => getOptionValue(opt) === props.modelValue
        );
        if (selectedIndex >= 0) {
          highlightedIndex.value = selectedIndex;
          scrollToHighlighted();
        }
      }
    });
  }
};

// 打开下拉菜单
const openDropdown = () => {
  if (props.disabled) return;
  if (!isOpen.value) {
    isOpen.value = true;
    searchQuery.value = ""; // 重置搜索
    highlightedIndex.value = 0;
    updateDropdownPosition();
    nextTick(() => {
      // 如果启用搜索，聚焦搜索框
      if (props.searchable && searchInputRef.value) {
        searchInputRef.value.focus();
      }
      if (selectedOption.value) {
        const selectedIndex = filteredOptions.value.findIndex(
          (opt) => getOptionValue(opt) === props.modelValue
        );
        if (selectedIndex >= 0) {
          highlightedIndex.value = selectedIndex;
          scrollToHighlighted();
        }
      }
    });
  }
};

// 关闭下拉菜单
const closeDropdown = () => {
  isOpen.value = false;
  highlightedIndex.value = 0;
  searchQuery.value = ""; // 重置搜索
};

// 选择选项
const selectOption = (option: SelectOption | Record<string, any>) => {
  const value = getOptionValue(option);
  if (value !== null) {
    emit("update:modelValue", value);
    emit("change", value);
    closeDropdown();
  }
};

// 键盘导航：向下
const navigateDown = () => {
  if (!isOpen.value) {
    openDropdown();
    return;
  }

  const maxIndex = filteredOptions.value.length - 1;
  if (highlightedIndex.value < maxIndex) {
    highlightedIndex.value++;
    scrollToHighlighted();
  }
};

// 键盘导航：向上
const navigateUp = () => {
  if (!isOpen.value) {
    openDropdown();
    return;
  }

  if (highlightedIndex.value > 0) {
    highlightedIndex.value--;
    scrollToHighlighted();
  }
};

// 选择高亮的选项
const selectHighlighted = () => {
  if (!isOpen.value) {
    openDropdown();
    return;
  }

  if (
    highlightedIndex.value >= 0 &&
    highlightedIndex.value < filteredOptions.value.length
  ) {
    const option = filteredOptions.value[highlightedIndex.value];
    if (option !== undefined && option !== null) {
      selectOption(option);
    }
  }
};

// 滚动到高亮的选项
const scrollToHighlighted = () => {
  nextTick(() => {
    if (!dropdownMenu.value) return;

    const listItems = dropdownMenu.value.querySelectorAll("li[role='option']");
    const targetItem = listItems[highlightedIndex.value] as HTMLElement;

    if (targetItem) {
      targetItem.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  });
};

// 监听搜索查询变化，重置高亮索引
watch(searchQuery, () => {
  if (isOpen.value) {
    highlightedIndex.value = 0;
  }
});

// 点击外部关闭
const handleClickOutside = (event: MouseEvent) => {
  if (
    selectContainer.value &&
    !selectContainer.value.contains(event.target as Node)
  ) {
    closeDropdown();
  }
};

// 监听点击外部事件
watch(isOpen, (newValue) => {
  if (newValue) {
    document.addEventListener("click", handleClickOutside);
  } else {
    document.removeEventListener("click", handleClickOutside);
  }
});

// 清理
onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

// 暴露方法供父组件调用
defineExpose({
  focus: () => {
    triggerButton.value?.focus();
  },
  blur: () => {
    triggerButton.value?.blur();
  },
});
</script>
