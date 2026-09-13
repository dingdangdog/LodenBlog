<template>
  <div class="space-y-6">
    <!-- 编辑表单 -->
    <div class="bg-surface border border-border rounded-2xl overflow-hidden">
      <!-- 消息提示 -->
      <div v-if="formMessage.text" class="mx-4 sm:mx-6 mt-4 sm:mt-6 p-3 rounded-lg text-sm" :class="messageClass">
        {{ formMessage.text }}
      </div>

      <!-- 文章ID显示（在tab上面） -->
      <div v-if="isEditMode" class="px-3 sm:px-4 py-2 flex items-center gap-2 text-xs text-muted">
        <span class="truncate">{{ $t("admin.editpost.fields.articleId") }}: {{ form.id }}</span>
      </div>

      <!-- 选项卡导航 -->
      <div class="border-b border-border overflow-x-auto overflow-y-hidden">
        <nav class="flex min-w-0 h-11">
          <button v-for="tab in EDIT_TABS" :key="tab.key" type="button" @click="activeTab = tab.key"
            :title="$t(tab.label)"
            class="box-border flex items-center flex-shrink-0 h-11 px-3 sm:px-5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
            :class="activeTab === tab.key
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-muted hover:text-foreground hover:border-border'
              ">
            <component :is="tab.icon" class="w-5 h-5 flex-shrink-0" />
            <span class="ml-1.5 sm:ml-2 hidden sm:inline">
              {{ $t(tab.label) }}
            </span>
          </button>
        </nav>
      </div>

      <!-- 语言 / 状态 / 操作：桌面单行，移动端紧凑 -->
      <div class="border-b border-border px-3 py-2 sm:px-4">
        <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-3">
          <div class="flex items-center gap-2 min-w-0 md:flex-1">
            <div v-if="isEditMode && originalIsPublished"
              class="inline-flex shrink-0 px-2.5 py-1 rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
              <span class="text-xs font-medium text-green-700 dark:text-green-300 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></span>
                {{ $t("admin.editpost.actions.published") }}
              </span>
            </div>
            <label class="text-sm font-medium text-foreground shrink-0 hidden md:inline">
              {{ $t("admin.editpost.languageSelector.label") }}
            </label>
            <AppSelect v-model="currentLanguageCode" :options="languageOptions" :disabled="loading || saving"
              :placeholder="$t('admin.editpost.languageSelector.placeholder')" :required="true" :allow-clear="false"
              class="w-full min-w-0 max-w-32 md:max-w-[240px] md:w-56 shrink-0" @change="
                (value) => {
                  currentLanguageCode = value as string;
                  handleLanguageChange();
                }
              " />
            <!-- <span v-if="isEditMode && !hasCurrentLanguageVersion"
              class="text-xs font-medium text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 shrink-0">
              {{ $t("admin.editpost.languageSelector.willCreate") }}
            </span> -->
          </div>
          <div class="grid grid-cols-3 gap-2 w-full md:w-auto md:flex md:items-center md:shrink-0">
            <NuxtLink to="/admin/posts"
              class="px-2 sm:px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium text-center truncate"
              :class="{ 'pointer-events-none opacity-50': saving }">
              {{ $t("admin.editpost.actions.back") }}
            </NuxtLink>
            <button type="button"
              class="px-2 sm:px-3 py-1.5 rounded-lg border border-border text-foreground bg-surface hover:bg-surface-muted transition-colors text-sm font-medium flex items-center justify-center gap-1 min-w-0"
              :disabled="savingOnly || loading" @click="handleSaveOnly">
              <ArrowPathIcon v-if="savingOnly" class="w-4 h-4 animate-spin flex-shrink-0" />
              <span v-else class="truncate">{{ $t("admin.editpost.actions.saveCurrentLanguage") }}</span>
            </button>
            <button type="button" @click="handleSubmit(true)"
              class="px-2 sm:px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-sm font-medium min-w-0"
              :disabled="saving">
              <span v-if="saving && savingAsPublished" class="flex items-center justify-center gap-1 truncate">
                <ArrowPathIcon class="w-4 h-4 animate-spin flex-shrink-0" />
                {{ $t("admin.editpost.actions.publishing") }}
              </span>
              <span v-else class="truncate">{{ $t("admin.editpost.actions.publish") }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 选项卡内容 -->
      <div class="">
        <!-- 基本信息选项卡 -->
        <div v-show="activeTab === 'basic'" class="p-2 md:p-4 space-y-3 md:space-y-6">
          <!-- 基本信息 -->
          <section class="space-y-4">
            <h2 class="text-lg font-semibold text-foreground">
              {{ $t("admin.editpost.sections.basic") }}
            </h2>
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  {{ $t("admin.editpost.fields.title") }}
                  <span class="text-red-500">*</span>
                </label>
                <input v-model="form.title" type="text" required :class="[
                  'w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-foreground placeholder-gray-400 focus:ring-1 transition',
                  titleCharCount > titleMaxChars
                    ? 'border-red-500 dark:border-red-500 focus:outline-none focus:ring-red-500'
                    : 'border-border focus:outline-none focus:ring-primary-500',
                ]" :placeholder="$t('admin.editpost.placeholders.title')" />
                <p class="mt-1 text-xs flex items-center justify-between">
                  <span class="text-muted">
                    {{ $t("admin.editpost.hints.title", { max: titleMaxChars }) }}
                  </span>
                  <span :class="titleCharCount > titleMaxChars
                    ? 'text-red-500 dark:text-red-400'
                    : 'text-muted'
                    ">
                    {{ titleCharCount }} / {{ titleMaxChars }}
                  </span>
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  {{ $t("admin.editpost.fields.slug") }}
                  <span class="text-red-500">*</span>
                </label>
                <div class="flex flex-col sm:flex-row gap-2">
                  <input v-model="form.slug" type="text" required
                    class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 transition"
                    :placeholder="$t('admin.editpost.placeholders.slug')"
                    @input="form.slug = form.slug.toLowerCase()" />
                  <button type="button"
                    class="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium whitespace-nowrap"
                    @click="translateToSlug" :disabled="translatingSlug || !form.title || !form.languageCode
                      " :title="!form.title
                        ? t('admin.editpost.messages.pleaseEnterTitle')
                        : !form.languageCode
                          ? t('admin.editpost.messages.pleaseSelectLanguage')
                          : t(
                            'admin.editpost.messages.generateSlugByTranslation',
                          )
                        ">
                    <ArrowPathIcon v-if="translatingSlug" class="w-4 h-4 animate-spin" />
                    <span v-else>{{
                      $t("admin.editpost.actions.generate")
                    }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 媒体资源 -->
            <section class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{{
                  $t("admin.editpost.fields.cover") }}</label>
                <div class="flex flex-col sm:flex-row gap-4">
                  <!-- 左侧预览区域 -->
                  <div
                    class="flex-shrink-0 w-full sm:w-48 h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                    <img v-if="form.featuredImage" :src="form.featuredImage"
                      :alt="$t('admin.editpost.placeholders.coverPreview')" class="w-full h-full object-cover" />
                    <span v-else class="text-xs text-gray-400 dark:text-gray-500">
                      {{ $t("admin.editpost.placeholders.coverEmpty") }}
                    </span>
                  </div>
                  <!-- 右侧输入和上传 -->
                  <div class="flex-1 space-y-2">
                    <input v-model="form.featuredImage" type="url"
                      class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 transition"
                      :placeholder="$t('admin.editpost.placeholders.coverUrl')" />
                    <div class="flex flex-wrap gap-2">
                      <button type="button" @click="showMediaSelect = true"
                        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium">
                        <PhotoIcon class="w-4 h-4" />
                        {{ $t("admin.editpost.actions.selectMedia") }}
                      </button>
                      <button type="button" @click="clearFeaturedImage" :disabled="!form.featuredImage"
                        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium">
                        <XMarkIcon class="w-4 h-4" />
                        {{ $t("admin.editpost.actions.clearCover") }}
                      </button>
                      <label
                        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium cursor-pointer"
                        :class="{
                          'opacity-50 cursor-not-allowed': featuredUploading,
                        }">
                        <PhotoIcon v-if="!featuredUploading" class="w-4 h-4" />
                        <ArrowPathIcon v-else class="w-4 h-4 animate-spin" />
                        {{
                          featuredUploading
                            ? $t("admin.editpost.actions.uploading")
                            : $t("admin.editpost.actions.upload")
                        }}
                        <input type="file" class="hidden" accept="image/*" @change="handleFeaturedUpload"
                          :disabled="featuredUploading" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{{
                $t("admin.editpost.fields.excerpt") }}</label>
              <textarea v-model="form.excerpt" rows="3" :class="[
                'w-full rounded-lg border bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-1 transition',
                excerptCharCount > excerptMaxChars
                  ? 'border-red-500 dark:border-red-500 focus:outline-none focus:ring-red-500'
                  : 'border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-primary-500',
              ]" :placeholder="$t('admin.editpost.placeholders.excerpt')"></textarea>
              <p class="mt-1 text-xs flex items-center justify-between">
                <span class="text-gray-500 dark:text-gray-400">
                  {{ $t("admin.editpost.hints.excerpt", { max: excerptMaxChars }) }}
                </span>
                <span :class="excerptCharCount > excerptMaxChars
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-gray-500 dark:text-gray-400'
                  ">
                  {{ excerptCharCount }} / {{ excerptMaxChars }}
                </span>
              </p>
            </div>
          </section>

          <!-- 分类和标签 -->
          <section class="space-y-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ $t("admin.editpost.sections.categoryTag") }}
            </h2>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{{
                $t("admin.editpost.fields.category") }}</label>
              <div class="flex flex-col sm:flex-row gap-2">
                <div class="w-full sm:w-52 min-w-0">
                  <AppSelect v-model="form.categorySlug" :options="categoryOptions"
                    :placeholder="$t('admin.editpost.placeholders.noCategory')" placement="top" :searchable="true"
                    class="flex-1 min-w-0" />
                </div>
                <button type="button" @click="showNewCategoryDialog = true"
                  class="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                  :disabled="!form.languageCode" :title="!form.languageCode
                    ? $t('admin.editpost.tooltips.selectLanguageFirst')
                    : $t('admin.editpost.actions.addCategory')
                    ">
                  <PlusIcon class="w-4 h-4" />
                  {{ $t("admin.editpost.actions.add") }}
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{{
                $t("admin.editpost.fields.tags") }}</label>
              <div class="space-y-2">
                <div class="flex flex-wrap gap-2">
                  <span v-for="tagSlug in form.tagSlugs" :key="tagSlug"
                    class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700">
                    {{ getTagName(tagSlug) }}
                    <button type="button" @click="removeTag(tagSlug)"
                      class="hover:text-primary-900 dark:hover:text-primary-100">
                      ×
                    </button>
                  </span>
                </div>
                <div class="flex flex-col sm:flex-row gap-2">
                  <div class="w-full sm:w-52 min-w-0">
                    <AppSelect v-model="selectedTagSlug" :options="tagOptions"
                      :placeholder="$t('admin.editpost.placeholders.noTag')" placement="top" :searchable="true"
                      class="flex-1" @change="(value) => addTag(value)" />
                  </div>
                  <button type="button" @click="showNewTagDialog = true"
                    class="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium flex items-center gap-2 whitespace-nowrap"
                    :disabled="!form.languageCode" :title="!form.languageCode
                      ? $t('admin.editpost.tooltips.selectLanguageFirst')
                      : $t('admin.editpost.actions.addTag')
                      ">
                    <PlusIcon class="w-4 h-4" />
                    {{ $t("admin.editpost.actions.add") }}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- 正文编辑选项卡 -->
        <div v-show="activeTab === 'content'" class="space-y-2 editpost-editor-wrap">
          <div>
            <MarkdownEditor ref="markdownEditorRef" v-model="form.content" :height="editorHeight"
              enable-insert-ad @upload-error="setMessage" />
            <p class="m-1 text-xs flex items-center justify-between">
              <!-- <span class="text-gray-500 dark:text-gray-400">
                {{ $t("admin.editpost.hints.content") }}
              </span> -->
              <span :class="contentCharCount < contentMinChars ||
                contentCharCount > contentMaxChars
                ? 'text-red-500 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400'
                ">
                {{ contentCharCount }} / {{ contentMinChars }}-{{
                  contentMaxChars
                }}
              </span>
            </p>
          </div>
        </div>

        <!-- SEO 设置选项卡 -->
        <div v-show="activeTab === 'seo'" class="p-2 md:p-4 space-y-3 md:space-y-6">
          <section class="space-y-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ $t("admin.editpost.tabs.seo") }}
            </h2>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{{
                $t("admin.editpost.fields.seoTitle") }}</label>
              <input v-model="form.seoTitle" type="text"
                class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 transition"
                :placeholder="$t('admin.editpost.placeholders.seoTitle')" />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ $t("admin.editpost.hints.seoTitle", { min: seoTitleMinChars, max: seoTitleMaxChars }) }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{{
                $t("admin.editpost.fields.seoDescription") }}</label>
              <textarea v-model="form.seoDescription" rows="3"
                class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 transition"
                :placeholder="$t('admin.editpost.placeholders.seoDescription')"></textarea>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ $t("admin.editpost.hints.seoDescription", { min: seoDescMinChars, max: seoDescMaxChars }) }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{{
                $t("admin.editpost.fields.seoKeyword") }}</label>
              <input v-model="form.seoKeyword" type="text"
                class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 transition"
                :placeholder="$t('admin.editpost.placeholders.seoKeyword')" />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ $t("admin.editpost.hints.seoKeyword") }}
              </p>
            </div>
          </section>
        </div>
      </div>

      <Teleport to="body">
        <!-- 新增分类对话框 -->
        <div v-if="showNewCategoryDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            class="bg-surface border border-border rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            @click.stop>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-foreground">
                {{ $t("admin.editpost.newCategoryDialog.title") }}
              </h3>
              <button type="button" @click="
                showNewCategoryDialog = false;
              newCategoryName = '';
              newCategorySlug = '';
              " class="text-muted hover:text-foreground">
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-foreground mb-2">
                  {{ $t("admin.editpost.newCategoryDialog.fields.name") }}
                  <span class="text-red-500">*</span>
                </label>
                <input v-model="newCategoryName" type="text"
                  class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary-500 transition"
                  :placeholder="$t('admin.editpost.newCategoryDialog.placeholders.name')
                    " @input="
                  if (
                      !newCategorySlug ||
                      newCategorySlug === generateSlugFromName(newCategoryName)
                    ) {
                      newCategorySlug = generateSlugFromName(newCategoryName);
                    }
                      " @keyup.enter="handleCreateCategory" />
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-2">
                  {{ $t("admin.editpost.newCategoryDialog.fields.slug") }}
                  <span class="text-red-500">*</span>
                </label>
                <div class="flex gap-2">
                  <input v-model="newCategorySlug" type="text"
                    class="flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary-500 transition"
                    :placeholder="$t('admin.editpost.newCategoryDialog.placeholders.slug')
                      " @input="newCategorySlug = newCategorySlug.toLowerCase()" @keyup.enter="handleCreateCategory" />
                  <button type="button"
                    class="px-4 py-2 rounded-lg border border-border text-foreground bg-surface hover:bg-surface-muted transition-colors text-sm font-medium whitespace-nowrap"
                    @click="translateToSlugForCategory" :disabled="translatingCategorySlug ||
                      !newCategoryName ||
                      !form.languageCode
                      " :title="!newCategoryName
                        ? $t(
                          'admin.editpost.newCategoryDialog.tooltips.enterName',
                        )
                        : !form.languageCode
                          ? $t(
                            'admin.editpost.newCategoryDialog.tooltips.selectLanguage',
                          )
                          : $t(
                            'admin.editpost.newCategoryDialog.tooltips.generateSlug',
                          )
                        ">
                    <ArrowPathIcon v-if="translatingCategorySlug" class="w-4 h-4 animate-spin" />
                    <span v-else>{{
                      $t("admin.editpost.actions.generate")
                    }}</span>
                  </button>
                </div>
                <p class="mt-1 text-xs text-muted">
                  {{ $t("admin.editpost.newCategoryDialog.hints.slug") }}
                </p>
              </div>
              <div class="flex justify-end gap-2">
                <button type="button" @click="
                  showNewCategoryDialog = false;
                newCategoryName = '';
                newCategorySlug = '';
                "
                  class="px-4 py-2 rounded-lg border border-border text-foreground bg-surface hover:bg-surface-muted transition-colors text-sm font-medium">
                  {{ $t("admin.editpost.newCategoryDialog.buttons.cancel") }}
                </button>
                <button type="button" @click="handleCreateCategory"
                  class="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  :disabled="!newCategoryName || !newCategorySlug || creatingCategory
                    ">
                  <span v-if="creatingCategory" class="flex items-center gap-2">
                    <ArrowPathIcon class="w-4 h-4 animate-spin" />
                    {{ $t("admin.editpost.newCategoryDialog.buttons.creating") }}
                  </span>
                  <span v-else>{{
                    $t("admin.editpost.newCategoryDialog.buttons.create")
                  }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 新增标签对话框 -->
        <div v-if="showNewTagDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            class="bg-surface border border-border rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            @click.stop>
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-foreground">
                {{ $t("admin.editpost.newTagDialog.title") }}
              </h3>
              <button type="button" @click="
                showNewTagDialog = false;
              newTagName = '';
              newTagSlug = '';
              " class="text-muted hover:text-foreground">
                <XMarkIcon class="w-5 h-5" />
              </button>
            </div>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-foreground mb-2">
                  {{ $t("admin.editpost.newTagDialog.fields.name") }}
                  <span class="text-red-500">*</span>
                </label>
                <input v-model="newTagName" type="text"
                  class="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary-500 transition"
                  :placeholder="$t('admin.editpost.newTagDialog.placeholders.name')
                    " @input="
                  if (
                      !newTagSlug ||
                      newTagSlug === generateSlugFromName(newTagName)
                    ) {
                      newTagSlug = generateSlugFromName(newTagName);
                    }
                      " @keyup.enter="handleCreateTag" />
              </div>
              <div>
                <label class="block text-sm font-medium text-foreground mb-2">
                  {{ $t("admin.editpost.newTagDialog.fields.slug") }}
                  <span class="text-red-500">*</span>
                </label>
                <div class="flex gap-2">
                  <input v-model="newTagSlug" type="text"
                    class="flex-1 rounded-lg border border-border bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary-500 transition"
                    :placeholder="$t('admin.editpost.newTagDialog.placeholders.slug')
                      " @input="newTagSlug = newTagSlug.toLowerCase()" @keyup.enter="handleCreateTag" />
                  <button type="button"
                    class="px-4 py-2 rounded-lg border border-border text-foreground bg-surface hover:bg-surface-muted transition-colors text-sm font-medium whitespace-nowrap"
                    @click="translateToSlugForTag" :disabled="translatingTagSlug || !newTagName || !form.languageCode
                      " :title="!newTagName
                        ? $t('admin.editpost.newTagDialog.tooltips.enterName')
                        : !form.languageCode
                          ? $t(
                            'admin.editpost.newTagDialog.tooltips.selectLanguage',
                          )
                          : $t(
                            'admin.editpost.newTagDialog.tooltips.generateSlug',
                          )
                        ">
                    <ArrowPathIcon v-if="translatingTagSlug" class="w-4 h-4 animate-spin" />
                    <span v-else>{{
                      $t("admin.editpost.actions.generate")
                    }}</span>
                  </button>
                </div>
                <p class="mt-1 text-xs text-muted">
                  {{ $t("admin.editpost.newTagDialog.hints.slug") }}
                </p>
              </div>
              <div class="flex justify-end gap-2">
                <button type="button" @click="
                  showNewTagDialog = false;
                newTagName = '';
                newTagSlug = '';
                "
                  class="px-4 py-2 rounded-lg border border-border text-foreground bg-surface hover:bg-surface-muted transition-colors text-sm font-medium">
                  {{ $t("admin.editpost.newTagDialog.buttons.cancel") }}
                </button>
                <button type="button" @click="handleCreateTag"
                  class="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  :disabled="!newTagName || !newTagSlug || creatingTag">
                  <span v-if="creatingTag" class="flex items-center gap-2">
                    <ArrowPathIcon class="w-4 h-4 animate-spin" />
                    {{ $t("admin.editpost.newTagDialog.buttons.creating") }}
                  </span>
                  <span v-else>{{
                    $t("admin.editpost.newTagDialog.buttons.create")
                  }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- 媒体选择器 -->
      <MediaSelect v-model="showMediaSelect" :multiple="false" :selected="form.featuredImage"
        @confirm="handleMediaSelect" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from "vue";
import MarkdownEditor from "~/components/editor/MarkdownEditor.client.vue";
import MediaSelect from "~/components/common/MediaSelect.vue";
const { t } = useI18n();
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  PhotoIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/vue/24/outline";

definePageMeta({
  layout: "admin",
  requiresAuth: true,
  middleware: ["auth", "creator"],
});

interface LanguageItem {
  id: string;
  code: string;
  name: string;
  nativeName: string;
}

interface ArticleItem {
  id: string;
  contentId?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featuredImage: string | null;
  status: string;
  isPublished: boolean;
  publishedAt: string | null;
  languageCode?: string;
  categorySlug?: string | null;
  tagSlugs?: string[];
  updatedAt: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeyword?: string | null;
}

const route = useRoute();
const router = useRouter();
const localePath = useLocalePath();

const languages = ref<LanguageItem[]>([]);
const loading = ref(false);
const saving = ref(false);
const savingAsPublished = ref(false);
const savingOnly = ref(false); // 顶部保存按钮的独立状态
type EditTabKey = "basic" | "content" | "seo";

const EDIT_TABS: {
  key: EditTabKey;
  icon: typeof DocumentTextIcon;
  label: string;
}[] = [
    { key: "basic", icon: DocumentTextIcon, label: "admin.editpost.tabs.basic" },
    { key: "content", icon: PencilSquareIcon, label: "admin.editpost.tabs.content" },
    { key: "seo", icon: MagnifyingGlassIcon, label: "admin.editpost.tabs.seo" },
  ];

const activeTab = ref<EditTabKey>("basic");

/** 由 .editpost-editor-wrap 的 CSS 变量按断点控制，桌面占满剩余视口 */
const editorHeight = "var(--editpost-editor-height)";
const originalIsPublished = ref(false);
const originalStatus = ref<string>("DRAFT"); // 保存原始状态
const currentLanguageCode = ref("");
const availableLanguageVersions = ref<string[]>([]); // 已存在的语言版本列表
const hasCurrentLanguageVersion = ref(false); // 当前选择的语言版本是否存在

interface CategoryItem {
  slug: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  languageCode: string;
}

interface TagItem {
  slug: string;
  name: string;
  color?: string;
  languageCode: string;
}

const dictionaryStore = useDictionaryStore();
const selectedTagSlug = ref("");

// 从store获取分类和标签列表
const categories = computed(() =>
  dictionaryStore.getCategoriesByLanguage(form.languageCode || ""),
);
const tags = computed(() =>
  dictionaryStore.getTagsByLanguage(form.languageCode || ""),
);

// 新增分类和标签相关状态
const showNewCategoryDialog = ref(false);
const showNewTagDialog = ref(false);
const newCategoryName = ref("");
const newCategorySlug = ref("");
const newTagName = ref("");
const newTagSlug = ref("");
const creatingCategory = ref(false);
const creatingTag = ref(false);
const translatingSlug = ref(false);
const translatingCategorySlug = ref(false);
const translatingTagSlug = ref(false);

const emptyForm = (): any => ({
  id: "",
  contentId: "",
  title: "",
  slug: "",
  languageId: "",
  languageCode: "",
  featuredImage: "",
  excerpt: "",
  content: "",
  categorySlug: "",
  tagSlugs: [] as string[],
  seoTitle: "",
  seoDescription: "",
  seoKeyword: "",
  isPublished: false,
});

const form = reactive(emptyForm());
const isEditMode = computed(() => !!form.id);

const formMessage = reactive({
  text: "",
  type: "success" as "success" | "error",
});

const markdownEditorRef = ref<any>(null);

const messageClass = computed(() =>
  formMessage.type === "success"
    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300",
);

// 字符限制常量
const titleMaxChars = 100;
const excerptMaxChars = 500;
const contentMinChars = 300;
const contentMaxChars = 50000;
const seoTitleMinChars = 30;
const seoTitleMaxChars = 60;
const seoDescMinChars = 50;
const seoDescMaxChars = 300;

// 字符数统计：与 markdown 编辑器一致，使用普通字符数（.length）
const titleCharCount = computed(() => (form.title || "").length);
const excerptCharCount = computed(() => (form.excerpt || "").length);
const contentCharCount = computed(() => (form.content || "").length);

const setMessage = (message: string, type: "success" | "error" = "error") => {
  formMessage.text = message;
  formMessage.type = type;
  setTimeout(() => {
    formMessage.text = "";
  }, 4000);
};

const loadLanguages = async () => {
  try {
    const response: any = await $fetch("/api/languages");
    if (response?.c === 200) {
      languages.value = Array.isArray(response.d) ? response.d : (response.d?.items || []);
    }
  } catch (error) {
    console.error("加载语言失败", error);
  }
};

// 获取系统设置的默认语言
const getSystemDefaultLanguage = async (): Promise<string | null> => {
  try {
    const response: any = await $fetch("/api/admin/settings");
    if (response?.c === 200 && response.d) {
      // 优先使用 defaultLang（用户在翻译设置中配置的默认语言）
      return response.d.defaultLang || null;
    }
  } catch (error) {
    console.error("获取系统设置失败", error);
  }
  return null;
};

// 字典数据已在系统初始化时全部加载，不需要单独加载

const filteredCategories = computed(() => {
  if (!form.languageCode) return [];
  return categories.value;
});

const filteredTags = computed(() => {
  if (!form.languageCode) return [];
  return tags.value.filter((t) => !form.tagSlugs.includes(t.slug));
});

const getTagName = (tagSlug: string) => {
  return dictionaryStore.getTagName(tagSlug, form.languageCode || "");
};

const getCategoryName = (categorySlug: string) => {
  return dictionaryStore.getCategoryName(categorySlug, form.languageCode || "");
};

const addTag = (value?: string | number | null) => {
  const tagSlug = value || selectedTagSlug.value;
  if (
    tagSlug &&
    typeof tagSlug === "string" &&
    !form.tagSlugs.includes(tagSlug)
  ) {
    form.tagSlugs.push(tagSlug);
    selectedTagSlug.value = "";
  }
};

// 语言选项
const languageOptions = computed(() => {
  return languages.value.map((lang) => ({
    value: lang.code,
    label: `${lang.nativeName} (${lang.code})`,
  }));
});

// 分类选项
const categoryOptions = computed(() => {
  return filteredCategories.value.map((cat) => ({
    value: cat.slug,
    label: cat.name,
  }));
});

// 标签选项
const tagOptions = computed(() => {
  return filteredTags.value.map((tag) => ({
    value: tag.slug,
    label: tag.name,
  }));
});

const removeTag = (tagSlug: string) => {
  const index = form.tagSlugs.indexOf(tagSlug);
  if (index > -1) {
    form.tagSlugs.splice(index, 1);
  }
};

// 生成slug
const generateSlugFromName = (name: string) => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

// 创建新分类
const handleCreateCategory = async () => {
  if (
    !newCategoryName.value.trim() ||
    !newCategorySlug.value.trim() ||
    !form.languageCode
  ) {
    return;
  }

  // 验证slug格式
  const slug = newCategorySlug.value.trim();
  if (!/^[a-z0-9-]+$/.test(slug)) {
    setMessage(t("admin.editpost.messages.slugInvalid"));
    return;
  }

  creatingCategory.value = true;
  try {
    const response: any = await $fetch("/api/creator/categories", {
      method: "POST",
      body: {
        name: newCategoryName.value.trim(),
        slug,
        languageCode: form.languageCode,
      },
    });

    if (response?.c === 200) {
      const newCategory = response.d.category;
      // 更新字典store
      dictionaryStore.updateCategory(newCategory.slug, form.languageCode, {
        name: newCategory.name,
        description: newCategory.description,
        color: newCategory.color,
        icon: newCategory.icon,
      });
      // 自动选中新创建的分类
      form.categorySlug = newCategory.slug;
      // 关闭对话框并重置
      showNewCategoryDialog.value = false;
      newCategoryName.value = "";
      newCategorySlug.value = "";
      setMessage(t("admin.editpost.messages.categoryCreateSuccess"), "success");
    } else {
      setMessage(
        response?.m || t("admin.editpost.messages.categoryCreateFailed"),
      );
    }
  } catch (err: any) {
    setMessage(
      err?.message || t("admin.editpost.messages.categoryCreateFailed"),
    );
  } finally {
    creatingCategory.value = false;
  }
};

// 创建新标签
const handleCreateTag = async () => {
  if (
    !newTagName.value.trim() ||
    !newTagSlug.value.trim() ||
    !form.languageCode
  ) {
    return;
  }

  // 验证slug格式
  const slug = newTagSlug.value.trim();
  if (!/^[a-z0-9-]+$/.test(slug)) {
    setMessage(t("admin.editpost.messages.slugInvalid"));
    return;
  }

  creatingTag.value = true;
  try {
    const response: any = await $fetch("/api/creator/tags", {
      method: "POST",
      body: {
        name: newTagName.value.trim(),
        slug,
        languageCode: form.languageCode,
      },
    });

    if (response?.c === 200) {
      const newTag = response.d.tag;
      // 更新字典store
      dictionaryStore.updateTag(newTag.slug, form.languageCode, {
        name: newTag.name,
        color: newTag.color,
      });
      // 自动添加到文章标签
      if (!form.tagSlugs.includes(newTag.slug)) {
        form.tagSlugs.push(newTag.slug);
      }
      // 关闭对话框并重置
      showNewTagDialog.value = false;
      newTagName.value = "";
      newTagSlug.value = "";
      setMessage(t("admin.editpost.messages.tagCreateSuccess"), "success");
    } else {
      setMessage(response?.m || t("admin.editpost.messages.tagCreateFailed"));
    }
  } catch (err: any) {
    setMessage(err?.message || t("admin.editpost.messages.tagCreateFailed"));
  } finally {
    creatingTag.value = false;
  }
};

// 监听当前语言变化（字典数据已在系统初始化时全部加载，这里只需要设置语言代码）
watch(
  () => currentLanguageCode.value,
  (newCode) => {
    if (newCode) {
      form.languageCode = newCode;
    }
  },
);

// 处理语言切换
const handleLanguageChange = async () => {
  if (!currentLanguageCode.value) return;

  // 如果是编辑模式，加载该语言版本的内容（loadArticle 会处理不存在的情况）
  if (isEditMode.value && form.id) {
    const exists = availableLanguageVersions.value.includes(
      currentLanguageCode.value,
    );
    hasCurrentLanguageVersion.value = exists;
    await loadArticle(form.id, currentLanguageCode.value);
  } else {
    // 新建模式，直接设置语言
    form.languageCode = currentLanguageCode.value;
  }
};

// 获取文章的所有语言版本
const loadArticleLanguageVersions = async (id: string) => {
  try {
    // 查询所有语言版本
    const response: any = await $fetch(`/api/creator/articles/${id}`, {
      query: { listVersions: true },
    });
    if (response?.c === 200 && response.d?.languageVersions) {
      availableLanguageVersions.value = response.d.languageVersions || [];
    }
  } catch (err) {
    console.error("获取语言版本列表失败", err);
  }
};

const loadArticle = async (id: string, languageCode?: string) => {
  loading.value = true;
  try {
    const query: any = {};
    if (languageCode) {
      query.languageCode = languageCode;
    }

    const response: any = await $fetch(`/api/creator/articles/${id}`, {
      query,
    });

    if (response?.c === 200 && response.d?.article) {
      const article = response.d.article as ArticleItem;
      form.id = article.id;
      form.contentId = article.contentId || "";
      form.title = article.title;
      form.slug = article.slug;

      // 处理语言：使用 languageCode
      if (article.languageCode) {
        form.languageCode = article.languageCode;
        currentLanguageCode.value = article.languageCode;
        hasCurrentLanguageVersion.value = true;
      }

      form.featuredImage = article.featuredImage || "";
      form.content = article.content;
      form.excerpt = article.excerpt || "";
      form.categorySlug = article.categorySlug || "";
      form.tagSlugs = article.tagSlugs || [];
      form.seoTitle = article.seoTitle || "";
      form.seoDescription = article.seoDescription || "";
      form.seoKeyword = article.seoKeyword || "";
      form.isPublished = article.isPublished;
      originalIsPublished.value = article.isPublished;
      originalStatus.value = article.status || "DRAFT"; // 保存原始状态

      // 如果是编辑模式，加载所有语言版本列表
      if (isEditMode.value) {
        await loadArticleLanguageVersions(id);
      }
    } else {
      // 如果指定语言版本不存在，标记为不存在
      if (languageCode && response?.c !== 200) {
        hasCurrentLanguageVersion.value = false;
        // 清空内容字段，但保留基础信息
        // categorySlug 和 tagSlugs 是跨语言共享的，保持不变
        form.contentId = "";
        form.title = "";
        form.slug = "";
        form.content = "";
        form.excerpt = "";
        form.seoTitle = "";
        form.seoDescription = "";
        form.seoKeyword = "";
        // featuredImage、categorySlug、tagSlugs 等基础信息保留
      } else {
        setMessage(t("common.articleNotFound"));
        router.push(localePath("/admin/posts"));
      }
    }
  } catch (err: any) {
    // 如果是指定语言版本不存在，这是正常的（API 返回错误）
    if (languageCode) {
      hasCurrentLanguageVersion.value = false;
      // 清空内容字段，但保留基础信息
      // categorySlug 和 tagSlugs 是跨语言共享的，保持不变
      form.contentId = "";
      form.title = "";
      form.slug = "";
      form.content = "";
      form.excerpt = "";
      form.seoTitle = "";
      form.seoDescription = "";
      form.seoKeyword = "";
      // featuredImage、categorySlug、tagSlugs 等基础信息保留
    } else {
      setMessage(err?.message || t("common.loadArticleFailed"));
      router.push(localePath("/admin/posts"));
    }
  } finally {
    loading.value = false;
  }
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const generateSlug = () => {
  if (!form.title) return;
  form.slug = slugify(form.title);
};

// 通过翻译生成 slug
const translateToSlug = async () => {
  if (!form.title || !form.languageCode) {
    setMessage(
      t("admin.editpost.messages.pleaseEnterTitle") +
      " " +
      t("admin.editpost.messages.pleaseSelectLanguage"),
      "error",
    );
    return;
  }

  translatingSlug.value = true;
  try {
    const response: any = await $fetch("/api/creator/getslug", {
      method: "POST",
      body: {
        text: form.title,
        from: form.languageCode,
        to: "en", // 默认翻译为英文
      },
    });

    if (response?.c === 200 && response.d?.slug) {
      form.slug = response.d.slug;
      setMessage(t("admin.editpost.messages.translateSlugSuccess"), "success");
    } else {
      setMessage(
        response?.m || t("admin.editpost.messages.translateSlugFailed"),
        "error",
      );
    }
  } catch (err: any) {
    setMessage(
      err?.message || t("admin.editpost.messages.translateSlugFailed"),
      "error",
    );
  } finally {
    translatingSlug.value = false;
  }
};

// 通过翻译生成分类 slug
const translateToSlugForCategory = async () => {
  if (!newCategoryName.value || !form.languageCode) {
    setMessage(
      t("admin.editpost.messages.enterCategoryNameAndLanguage"),
      "error",
    );
    return;
  }

  translatingCategorySlug.value = true;
  try {
    const response: any = await $fetch("/api/creator/getslug", {
      method: "POST",
      body: {
        text: newCategoryName.value,
        from: form.languageCode,
        to: "en", // 默认翻译为英文
      },
    });

    if (response?.c === 200 && response.d?.slug) {
      newCategorySlug.value = response.d.slug;
      setMessage(t("admin.editpost.messages.translateSlugSuccess"), "success");
    } else {
      setMessage(
        response?.m || t("admin.editpost.messages.translateSlugFailed"),
        "error",
      );
    }
  } catch (err: any) {
    setMessage(
      err?.message || t("admin.editpost.messages.translateSlugFailed"),
      "error",
    );
  } finally {
    translatingCategorySlug.value = false;
  }
};

// 通过翻译生成标签 slug
const translateToSlugForTag = async () => {
  if (!newTagName.value || !form.languageCode) {
    setMessage(t("admin.editpost.messages.enterTagNameAndLanguage"), "error");
    return;
  }

  translatingTagSlug.value = true;
  try {
    const response: any = await $fetch("/api/creator/getslug", {
      method: "POST",
      body: {
        text: newTagName.value,
        from: form.languageCode,
        to: "en", // 默认翻译为英文
      },
    });

    if (response?.c === 200 && response.d?.slug) {
      newTagSlug.value = response.d.slug;
      setMessage(t("admin.editpost.messages.translateSlugSuccess"), "success");
    } else {
      setMessage(
        response?.m || t("admin.editpost.messages.translateSlugFailed"),
        "error",
      );
    }
  } catch (err: any) {
    setMessage(
      err?.message || t("admin.editpost.messages.translateSlugFailed"),
      "error",
    );
  } finally {
    translatingTagSlug.value = false;
  }
};

watch(
  () => form.title,
  (val) => {
    if (!form.id && !form.slug) {
      form.slug = slugify(val || "");
    }
  },
);

const generateExcerpt = (content: string, length = 160) => {
  const text = content
    .replace(/[#>*_`~\-!\[\]\(\)]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, length);
};

const normalizeExcerptForSave = () => {
  if (!form.excerpt) return;
  if (form.excerpt.length <= excerptMaxChars) return;

  // 超长时自动截断，并补上省略号，避免保存失败
  const suffix = "...";
  const safeLength = Math.max(excerptMaxChars - suffix.length, 0);
  form.excerpt = `${form.excerpt.slice(0, safeLength)}${suffix}`;
};

const featuredImageForSave = (): string | null => {
  const value =
    typeof form.featuredImage === "string" ? form.featuredImage.trim() : "";
  return value || null;
};

const clearFeaturedImage = () => {
  form.featuredImage = "";
};

const featuredUploading = ref(false);
const showMediaSelect = ref(false);

// 处理媒体选择确认
const handleMediaSelect = (url: string | string[]) => {
  if (typeof url === "string") {
    form.featuredImage = url;
  } else if (url.length > 0) {
    form.featuredImage = url[0];
  }
  showMediaSelect.value = false;
};

const handleFeaturedUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) {
    return;
  }

  const file = target.files[0];
  if (!file) {
    return;
  }

  featuredUploading.value = true;
  setMessage("", "success");

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response: any = await $fetch("/api/creator/cover", {
      method: "POST",
      body: formData,
    });

    if (response?.c === 200) {
      form.featuredImage = response.d.url;
      setMessage(t("admin.editpost.messages.coverUploadSuccess"), "success");
    } else {
      setMessage(response?.m || t("admin.editpost.messages.coverUploadFailed"));
    }
  } catch (err: any) {
    setMessage(err?.message || t("admin.editpost.messages.coverUploadFailed"));
  } finally {
    featuredUploading.value = false;
    target.value = "";
  }
};

// 顶部保存按钮：只保存数据，不改变状态
const handleSaveOnly = async () => {
  // 确保有 languageCode
  if (!form.languageCode) {
    setMessage(t("admin.editpost.messages.selectLanguage"));
    activeTab.value = "basic";
    return;
  }

  if (!form.title || !form.slug || !form.content) {
    setMessage(t("admin.editpost.messages.pleaseFillRequiredFields"));
    if (!form.title || !form.slug) {
      activeTab.value = "basic";
    } else if (!form.content) {
      activeTab.value = "content";
    }
    return;
  }

  normalizeExcerptForSave();

  // 验证标题字符数
  const titleCount = titleCharCount.value;
  if (titleCount > titleMaxChars) {
    setMessage(
      t("admin.editpost.messages.titleExceedsLimit", { max: titleMaxChars }),
    );
    activeTab.value = "basic";
    return;
  }

  // 验证摘要字符数
  if (form.excerpt) {
    const excerptCount = excerptCharCount.value;
    if (excerptCount > excerptMaxChars) {
      setMessage(
        t("admin.editpost.messages.excerptExceedsLimit", {
          max: excerptMaxChars,
        }),
      );
      activeTab.value = "basic";
      return;
    }
  }

  // 验证正文字符数
  const contentCount = contentCharCount.value;
  if (contentCount < contentMinChars) {
    setMessage(
      t("admin.editpost.messages.contentTooShort", { min: contentMinChars }),
    );
    activeTab.value = "content";
    return;
  }
  if (contentCount > contentMaxChars) {
    setMessage(
      t("admin.editpost.messages.contentExceedsLimit", {
        max: contentMaxChars,
      }),
    );
    activeTab.value = "content";
    return;
  }

  savingOnly.value = true;

  try {
    // 如果是编辑模式，保持原始状态；如果是新建模式，使用草稿状态
    let finalStatus: string;
    let finalIsPublished: boolean;

    if (isEditMode.value) {
      // 编辑模式：保持原始状态
      finalStatus = originalStatus.value;
      finalIsPublished = originalIsPublished.value;
    } else {
      // 新建模式：使用草稿状态
      finalStatus = "DRAFT";
      finalIsPublished = false;
    }

    const payload: any = {
      slug: form.slug,
      title: form.title,
      content: form.content,
      excerpt: form.excerpt || generateExcerpt(form.content),
      featuredImage: featuredImageForSave(),
      categorySlug: form.categorySlug || undefined,
      tagSlugs: form.tagSlugs.length > 0 ? form.tagSlugs : undefined,
      seoTitle: form.seoTitle?.trim() ? form.seoTitle.trim() : null,
      seoDescription: form.seoDescription?.trim()
        ? form.seoDescription.trim()
        : null,
      seoKeyword: form.seoKeyword?.trim() ? form.seoKeyword.trim() : null,
      status: finalStatus,
      isPublished: finalIsPublished,
      languageCode: form.languageCode,
    };

    // 如果是编辑模式，传递 contentId
    if (form.id && form.contentId) {
      payload.contentId = form.contentId;
    }

    const endpoint = form.id
      ? `/api/creator/articles/${form.id}`
      : "/api/creator/articles";
    const method = form.id ? "PATCH" : "POST";

    const response: any = await $fetch(endpoint, {
      method,
      body: payload,
    });

    if (response?.c === 200) {
      setMessage(t("admin.editpost.messages.saveSuccess"), "success");

      // 如果是新建文章，更新 form.id 和 form.contentId
      if (!form.id && response.d?.article) {
        form.id = response.d.article.id;
        if (response.d.article.contentId) {
          form.contentId = response.d.article.contentId;
        }
        // 新建文章后，更新原始状态为草稿
        originalIsPublished.value = false;
        originalStatus.value = "DRAFT";
      }
    } else {
      setMessage(response?.m || t("admin.editpost.messages.saveFailed"));
    }
  } catch (err: any) {
    setMessage(err?.message || t("admin.editpost.messages.saveArticleFailed"));
  } finally {
    savingOnly.value = false;
  }
};

// 底部保存按钮：保存草稿或发布
const handleSubmit = async (
  publish: boolean,
  options: { stay?: boolean } = {},
) => {
  // 确保有 languageCode
  if (!form.languageCode) {
    setMessage(t("admin.editpost.messages.selectLanguage"));
    activeTab.value = "basic";
    return;
  }

  if (!form.title || !form.slug || !form.content) {
    setMessage(t("admin.editpost.messages.pleaseFillRequiredFields"));
    // 如果缺少必填项，切换到对应的选项卡
    if (!form.title || !form.slug) {
      activeTab.value = "basic";
    } else if (!form.content) {
      activeTab.value = "content";
    }
    return;
  }

  normalizeExcerptForSave();

  // 验证标题字符数
  const titleCount = titleCharCount.value;
  if (titleCount > titleMaxChars) {
    setMessage(
      t("admin.editpost.messages.titleExceedsLimit", { max: titleMaxChars }),
    );
    activeTab.value = "basic";
    return;
  }

  // 验证摘要字符数
  if (form.excerpt) {
    const excerptCount = excerptCharCount.value;
    if (excerptCount > excerptMaxChars) {
      setMessage(
        t("admin.editpost.messages.excerptExceedsLimit", {
          max: excerptMaxChars,
        }),
      );
      activeTab.value = "basic";
      return;
    }
  }

  // 验证正文字符数
  const contentCount = contentCharCount.value;
  if (contentCount < contentMinChars) {
    setMessage(
      t("admin.editpost.messages.contentTooShort", { min: contentMinChars }),
    );
    activeTab.value = "content";
    return;
  }
  if (contentCount > contentMaxChars) {
    setMessage(
      t("admin.editpost.messages.contentExceedsLimit", {
        max: contentMaxChars,
      }),
    );
    activeTab.value = "content";
    return;
  }

  saving.value = true;
  savingAsPublished.value = publish;

  try {
    // 根据 publish 参数设置状态
    const finalStatus = publish ? "PUBLISHED" : "DRAFT";
    const finalIsPublished = publish;

    const payload: any = {
      slug: form.slug,
      title: form.title,
      content: form.content,
      excerpt: form.excerpt || generateExcerpt(form.content),
      featuredImage: featuredImageForSave(),
      categorySlug: form.categorySlug || undefined,
      tagSlugs: form.tagSlugs.length > 0 ? form.tagSlugs : undefined,
      seoTitle: form.seoTitle?.trim() ? form.seoTitle.trim() : null,
      seoDescription: form.seoDescription?.trim()
        ? form.seoDescription.trim()
        : null,
      seoKeyword: form.seoKeyword?.trim() ? form.seoKeyword.trim() : null,
      status: finalStatus,
      isPublished: finalIsPublished,
      languageCode: form.languageCode,
    };

    // 如果是编辑模式，传递 contentId
    if (form.id && form.contentId) {
      payload.contentId = form.contentId;
    }

    const endpoint = form.id
      ? `/api/creator/articles/${form.id}`
      : "/api/creator/articles";
    const method = form.id ? "PATCH" : "POST";

    const response: any = await $fetch(endpoint, {
      method,
      body: payload,
    });

    if (response?.c === 200) {
      let successMessage: string;
      if (form.id) {
        successMessage = publish
          ? t("admin.editpost.messages.articlePublished")
          : t("admin.editpost.messages.articleSaved");
      } else {
        successMessage = publish
          ? t("admin.editpost.messages.articleCreatedAndPublished")
          : t("admin.editpost.messages.articleCreatedAndSaved");
      }
      setMessage(successMessage, "success");

      // 如果是新建文章，更新 form.id 和 form.contentId
      if (!form.id && response.d?.article) {
        form.id = response.d.article.id;
        if (response.d.article.contentId) {
          form.contentId = response.d.article.contentId;
        }
      }

      // 更新原始发布状态
      if (publish) {
        originalIsPublished.value = true;
        originalStatus.value = "PUBLISHED";
      }

      // 延迟跳转，让用户看到成功消息
      if (!options.stay) {
        setTimeout(() => {
          router.push(localePath("/admin/posts"));
        }, 1000);
      }
    } else {
      setMessage(response?.m || t("admin.editpost.messages.saveFailed"));
    }
  } catch (err: any) {
    setMessage(err?.message || t("admin.editpost.messages.saveArticleFailed"));
  } finally {
    saving.value = false;
    savingAsPublished.value = false;
  }
};

onMounted(async () => {
  await loadLanguages();
  // 加载字典数据（store会自动处理缓存）
  await dictionaryStore.loadDictionaries();

  // 检查是否有文章 ID 参数
  const articleId = route.query.id as string;
  if (articleId) {
    await loadArticle(articleId);
  } else {
    // 新建模式，重置表单
    Object.assign(form, emptyForm());
    originalIsPublished.value = false;
    originalStatus.value = "DRAFT";

    // 获取系统设置的默认语言
    const systemDefaultLang = await getSystemDefaultLanguage();

    // 确定默认语言：优先使用系统设置的默认语言，如果没有则使用第一个可用语言
    let defaultLanguageCode: string | null = null;

    if (systemDefaultLang) {
      // 检查默认语言是否在可用语言列表中
      const defaultLangExists = languages.value.some(
        (lang) => lang.code === systemDefaultLang,
      );
      if (defaultLangExists) {
        defaultLanguageCode = systemDefaultLang;
      }
    }

    // 如果默认语言不存在或未设置，使用第一个可用语言
    if (
      !defaultLanguageCode &&
      languages.value.length > 0 &&
      languages.value[0]
    ) {
      defaultLanguageCode = languages.value[0].code;
    }

    // 设置默认语言
    if (defaultLanguageCode) {
      currentLanguageCode.value = defaultLanguageCode;
      form.languageCode = defaultLanguageCode;
    }
  }
});
</script>

<style scoped>
.editpost-editor-wrap {
  --editpost-editor-height: min(580px, calc(100dvh - 10rem));
}

@media (min-width: 1024px) {
  .editpost-editor-wrap {
    --editpost-editor-height: min(800px, calc(100dvh - 10rem));
  }
}
</style>
