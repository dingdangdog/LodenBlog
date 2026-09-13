<template>
  <div class="space-y-4">
    <!-- 消息提示 -->
    <div v-if="message.text" class="mx-6 p-3 rounded-lg text-sm" :class="messageClass">
      {{ message.text }}
    </div>

    <!-- 筛选栏：响应式布局，手机端堆叠/全宽 -->
    <div class="bg-surface border border-border rounded-2xl p-3 sm:p-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
        <div class="w-full sm:w-64 md:w-96">
          <input v-model="filters.search" type="text" :placeholder="$t('admin.posts.searchPlaceholder')"
            class="w-full rounded-lg border border-border bg-transparent p-1 md:px-3 md:py-2.5 text-sm text-foreground placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 transition"
            @keyup.enter="loadArticles(1, false)" />
          <div v-if="parsedSearchKeywords.length > 1" class="mt-1.5 flex flex-wrap gap-1">
            <span v-for="keyword in parsedSearchKeywords" :key="keyword"
              class="px-1.5 py-0.5 rounded bg-surface-muted text-[11px] text-muted">
              {{ keyword }}
            </span>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          <div class="min-w-0 sm:w-40">
            <AppSelect v-model="filters.published" :options="publishedStatusOptions" />
          </div>
          <div class="min-w-0 sm:w-40">
            <AppSelect v-model="filters.categorySlug" :options="categoryOptions"
              :placeholder="$t('admin.posts.filters.allCategories')" />
          </div>
          <div class="min-w-0 sm:w-40">
            <AppSelect v-model="filters.tagSlug" :options="tagOptions"
              :placeholder="$t('admin.posts.filters.allTags')" />
          </div>
          <div class="min-w-0 sm:w-40">
            <AppSelect v-model="filters.sortBy" :options="sortByOptions"
              :placeholder="$t('admin.posts.filters.sortBy')" />
          </div>
          <div class="min-w-0 sm:w-32">
            <AppSelect v-model="filters.sortOrder" :options="sortOrderOptions"
              :placeholder="$t('admin.posts.filters.sortOrder')" />
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2 sm:gap-3">
          <button type="button"
            class="flex-1 min-w-0 sm:flex-none p-1 md:px-3 md:py-2 rounded-md md:rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors text-sm font-medium"
            @click="loadArticles(1, false)">
            {{ $t("admin.posts.filters.apply") }}
          </button>
          <button type="button"
            class="p-1 md:p-2.5 rounded-md md:rounded-xl border border-border text-foreground hover:bg-surface-muted transition-colors sm:px-4 sm:py-2"
            @click="loadArticles(1, false)" :disabled="listLoading" :title="$t('common.refresh')">
            <span class="flex items-center gap-2">
              <ArrowPathIcon :class="['w-4 h-4 flex-shrink-0', listLoading && 'animate-spin']" />
              <!-- <span class="hidden sm:inline">{{ $t("common.refresh") }}</span> -->
            </span>
          </button>
          <button type="button"
            class="flex-1 min-w-0 sm:flex-none p-1 md:px-3 md:py-2 rounded-md md:rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            @click="startCreate">
            <PlusIcon class="w-4 h-4 flex-shrink-0" />
            {{ $t("admin.posts.actions.create") }}
          </button>
          <button type="button"
            class="flex-1 min-w-0 sm:flex-none p-1 md:px-3 md:py-2 rounded-md md:rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            @click="showGenerateArticleModal = true">
            <SparklesIcon class="w-4 h-4 flex-shrink-0" />
            <span class="truncate">{{ $t("admin.posts.actions.generateWithAI") }}</span>
          </button>
          <button type="button"
            class="flex-1 min-w-0 sm:flex-none p-1 md:px-3 md:py-2 rounded-md md:rounded-xl border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium flex items-center justify-center gap-2"
            @click="showAiGenerationLogsModal = true">
            <ClockIcon class="w-4 h-4 flex-shrink-0" />
            <span class="truncate">{{ $t("admin.posts.actions.aiGenerationLogs") }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 文章列表 -->
    <div class="bg-surface border border-border rounded-md md:rounded-2xl overflow-hidden">
      <div class="p-3 sm:p-4 border-b border-border">
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-base sm:text-lg font-semibold text-foreground truncate min-w-0">
            {{ $t("admin.posts.title") }}
          </h2>
          <span class="px-2 py-1 rounded-lg bg-surface-muted text-xs font-medium text-muted flex-shrink-0">
            {{ pagination.total }}
          </span>
        </div>
      </div>

      <div class="max-h-[calc(100vh-12rem)] sm:max-h-[calc(100vh-200px)] overflow-y-auto">
        <!-- 加载状态 -->
        <div v-if="listLoading || dictionaryStore.loading" class="p-6 sm:p-8 text-center text-sm text-muted">
          <ArrowPathIcon class="w-6 h-6 mx-auto mb-2 animate-spin" />
          <p>{{ $t("admin.posts.actions.loading") }}</p>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!articles.length" class="p-6 sm:p-8 text-center text-sm text-muted">
          <DocumentTextIcon class="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 text-muted" />
          <p class="font-medium mb-1">
            {{ $t("admin.posts.actions.noArticles") }}
          </p>
          <p class="text-xs">{{ $t("admin.posts.actions.createHint") }}</p>
        </div>

        <!-- 文章列表：响应式卡片，手机端纵向堆叠、触控友好 -->
        <div v-else class="divide-y divide-border">
          <article v-for="article in articles" :key="article.id" class="bg-surface">
            <a :href="getArticleUrl(article)" target="_blank"
              class="block p-2 sm:p-4 transition-colors hover:bg-surface-muted active:bg-surface-muted group">
              <!-- 手机端：第一行封面+信息，第二行操作；桌面端一行：封面+信息+操作 -->
              <div class="flex flex-col gap-2 sm:flex-row sm:gap-3">
                <div class="flex gap-3 flex-1 min-w-0">
                  <!-- 封面图：手机端较小方形，桌面端保持 24 -->
                  <div v-if="article.featuredImage"
                    class="flex-shrink-0 w-14 h-14 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-surface-muted">
                    <img :src="article.featuredImage" :alt="article.title" class="w-full h-full object-cover" />
                  </div>
                  <div v-else
                    class="flex-shrink-0 w-14 h-14 sm:w-24 sm:h-24 rounded-lg bg-surface-muted flex items-center justify-center">
                    <DocumentTextIcon class="w-7 h-7 sm:w-12 sm:h-12 text-gray-400" />
                  </div>

                  <!-- 文章信息 -->
                  <div class="flex-1 min-w-0 flex flex-col gap-1">
                    <div class="flex items-start justify-between gap-2">
                      <h3
                        class="text-sm sm:text-base font-semibold text-foreground line-clamp-2 group-hover:text-primary-600 transition-colors flex-1 min-w-0">
                        {{ article.title }}
                      </h3>
                    </div>
                    <!-- 状态、分类、日期等：手机端单行可换行 -->
                    <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span class="px-2 py-0.5 rounded text-xs font-medium" :class="getStatusClass(article)">
                        {{ formatStatus(article) }}
                      </span>
                      <span v-if="article.categorySlug"
                        class="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {{ getCategoryName(article) }}
                      </span>
                      <span v-for="tagSlug in (article.tagSlugs || []).slice(0, 3)" :key="tagSlug"
                        class="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        {{ getTagName(tagSlug, article.languageCode || "") }}
                      </span>
                      <span v-if="(article.tagSlugs?.length || 0) > 3" class="text-xs text-muted">+{{
                        (article.tagSlugs?.length || 0) - 3 }}</span>
                      <span v-if="article.viewCount !== undefined"
                        class="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 flex items-center gap-1">
                        <EyeIcon class="w-3 h-3" />
                        {{ article.viewCount }}
                      </span>
                      <span v-if="article.bookmarkCount !== undefined"
                        class="px-2 py-0.5 rounded text-xs font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 flex items-center gap-1">
                        <BookmarkIcon class="w-3 h-3" />
                        {{ article.bookmarkCount }}
                      </span>
                      <span v-if="(article.pinOrder ?? 0) > 0"
                        class="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                        <ArrowUpCircleIcon class="w-3 h-3" />
                        {{ $t("admin.posts.status.pinned") }}
                      </span>
                      <span class="text-xs text-muted">
                        {{ formatDate(article.updatedAt) }}
                      </span>
                    </div>
                    <!-- 已具备语言：桌面显示，手机端折叠或隐藏以省空间 -->
                    <div v-if="
                      article.availableLanguages &&
                      article.availableLanguages.length > 0
                    " class="hidden sm:flex items-center gap-1.5 flex-wrap mt-0.5">
                      <span class="text-xs text-muted">
                        {{ $t("admin.posts.availableLanguages") }}:
                      </span>
                      <span v-for="langCode in article.availableLanguages" :key="langCode"
                        class="px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                        :title="getLanguageName(langCode)">
                        {{ getLanguageDisplayName(langCode) }}
                      </span>
                    </div>
                    <p v-if="article.slug" class="text-xs text-muted mt-0.5 truncate hidden sm:block">
                      Slug: {{ article.slug }}
                    </p>
                  </div>
                </div>

                <!-- 操作按钮：手机端加大触控区域、横向排列 -->
                <div class="flex items-center justify-end sm:justify-start gap-0.5 sm:gap-1 flex-shrink-0" @click.stop>
                  <EyeIcon
                    class="w-5 h-5 sm:w-6 sm:h-6 text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hidden sm:block" />
                  <button v-if="(article.pinOrder ?? 0) > 0" type="button" @click.stop.prevent="handleUnpin(article)"
                    :disabled="pinningArticles.has(article.id)"
                    class="min-w-[2.75rem] min-h-[2.75rem] sm:min-w-0 sm:min-h-0 p-1 sm:p-2 rounded-lg sm:rounded text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-surface-muted active:bg-surface-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    :title="$t('admin.posts.actions.unpin')">
                    <ArrowDownCircleIcon class="w-5 h-5 sm:w-6 sm:h-6 mx-auto" />
                  </button>
                  <button type="button" @click.stop.prevent="handlePin(article)"
                    :disabled="pinningArticles.has(article.id)"
                    class="min-w-[2.75rem] min-h-[2.75rem] sm:min-w-0 sm:min-h-0 p-1 sm:p-2 rounded-lg sm:rounded text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-surface-muted active:bg-surface-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    :title="$t('admin.posts.actions.pin')">
                    <ArrowUpCircleIcon v-if="!pinningArticles.has(article.id)" class="w-5 h-5 sm:w-6 sm:h-6 mx-auto" />
                    <ArrowPathIcon v-else class="w-5 h-5 sm:w-6 sm:h-6 mx-auto animate-spin" />
                  </button>
                  <button type="button" @click.stop.prevent="editArticle(article.id)"
                    class="min-w-[2.75rem] min-h-[2.75rem] sm:min-w-0 sm:min-h-0 p-1 sm:p-2 rounded-lg sm:rounded text-gray-400 hover:text-primary-600 hover:bg-surface-muted active:bg-surface-muted transition-colors touch-manipulation"
                    :title="$t('admin.posts.actions.edit')">
                    <PencilSquareIcon class="w-5 h-5 sm:w-6 sm:h-6 mx-auto" />
                  </button>
                  <button v-if="!article.isPublished" type="button" @click.stop.prevent="handlePublish(article)"
                    :disabled="publishingArticles.has(article.id)"
                    class="min-w-[2.75rem] min-h-[2.75rem] sm:min-w-0 sm:min-h-0 p-1 sm:p-2 rounded-lg sm:rounded text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    :title="$t('admin.posts.actions.publish')">
                    <ArrowUpTrayIcon v-if="!publishingArticles.has(article.id)" class="w-5 h-5 sm:w-6 sm:h-6 mx-auto" />
                    <ArrowPathIcon v-else class="w-5 h-5 sm:w-6 sm:h-6 mx-auto animate-spin" />
                  </button>
                  <button type="button" @click.stop.prevent="openCommentsModal(article)"
                    class="min-w-[2.75rem] min-h-[2.75rem] sm:min-w-0 sm:min-h-0 p-1 sm:p-2 rounded-lg sm:rounded text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-surface-muted transition-colors touch-manipulation"
                    :title="$t('admin.posts.actions.comments')">
                    <ChatBubbleLeftIcon class="w-5 h-5 sm:w-6 sm:h-6 mx-auto" />
                  </button>
                  <button type="button" @click.stop.prevent="handleVisitAnalysis(article)"
                    class="min-w-[2.75rem] min-h-[2.75rem] sm:min-w-0 sm:min-h-0 p-1 sm:p-2 rounded-lg sm:rounded text-gray-400 hover:text-green-600 hover:bg-surface-muted transition-colors touch-manipulation"
                    :title="$t('admin.posts.actions.visitAnalysis')">
                    <ChartBarIcon class="w-5 h-5 sm:w-6 sm:h-6 mx-auto" />
                  </button>
                  <button type="button" @click.stop.prevent="handleTranslate(article)"
                    class="min-w-[2.75rem] min-h-[2.75rem] sm:min-w-0 sm:min-h-0 p-1 sm:p-2 rounded-lg sm:rounded text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    :title="$t('admin.posts.actions.translate')">
                    <LanguageIcon v-if="!translatingArticles.has(article.id)" class="w-5 h-5 sm:w-6 sm:h-6 mx-auto" />
                    <ArrowPathIcon v-else class="w-5 h-5 sm:w-6 sm:h-6 mx-auto animate-spin" />
                  </button>
                  <button type="button" @click.stop.prevent="handleDelete(article)"
                    :disabled="deletingArticles.has(article.id)"
                    class="min-w-[2.75rem] min-h-[2.75rem] sm:min-w-0 sm:min-h-0 p-1 sm:p-2 rounded-lg sm:rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    :title="$t('admin.posts.actions.delete')">
                    <TrashIcon v-if="!deletingArticles.has(article.id)" class="w-5 h-5 sm:w-6 sm:h-6 mx-auto" />
                    <ArrowPathIcon v-else class="w-5 h-5 sm:w-6 sm:h-6 mx-auto animate-spin" />
                  </button>
                </div>
              </div>
            </a>
          </article>
        </div>

        <!-- 加载更多指示器 -->
        <div v-if="loadingMore" class="p-8 text-center text-sm text-gray-500">
          <ArrowPathIcon class="w-6 h-6 mx-auto mb-2 animate-spin" />
          <p>
            {{ $t("common.loadMore") }}
          </p>
        </div>
        <div v-else-if="hasMore && articles.length > 0" ref="loadMoreTrigger" class="h-1"></div>
      </div>
    </div>

    <Teleport to="body">
      <!-- 删除确认对话框 -->
      <div v-if="deleteDialog.show" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        @click.self="deleteDialog.show = false">
        <div class="bg-surface text-foreground border border-border rounded-lg shadow-xl p-6 w-full max-w-md"
          @click.stop>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-foreground">
              {{ $t("admin.posts.deleteDialog.title") }}
            </h3>
            <button type="button" @click="deleteDialog.show = false" class="text-muted hover:text-foreground">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
          <div class="space-y-4">
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div class="flex items-start gap-3">
                <ExclamationTriangleIcon class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div class="flex-1">
                  <p class="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
                    {{ $t("admin.posts.deleteDialog.warning") }}
                  </p>
                  <p class="text-xs text-red-700 dark:text-red-400">
                    {{ $t("admin.posts.deleteDialog.warningText") }}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <p class="text-sm text-muted">
                {{ $t("admin.posts.deleteDialog.articleTitle")
                }}<span class="font-medium">{{ deleteDialog.articleTitle }}</span>
              </p>
            </div>
            <div class="flex justify-end gap-2">
              <button type="button" @click="deleteDialog.show = false"
                class="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium">
                {{ $t("admin.posts.deleteDialog.cancel") }}
              </button>
              <button type="button" @click="confirmDelete" :disabled="deletingArticles.has(deleteDialog.articleId)"
                class="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2">
                <ArrowPathIcon v-if="deletingArticles.has(deleteDialog.articleId)" class="w-4 h-4 animate-spin" />
                {{
                  deletingArticles.has(deleteDialog.articleId)
                    ? $t("admin.posts.deleteDialog.deleting")
                    : $t("admin.posts.deleteDialog.confirm")
                }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 翻译确认对话框 -->
      <div v-if="translateDialog.show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-surface text-foreground border border-border rounded-lg shadow-xl p-6 w-full max-w-lg"
          @click.stop>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-foreground">
              {{ $t("admin.posts.translateDialog.title") }}
            </h3>
            <button type="button" @click="translateDialog.show = false" class="text-muted hover:text-foreground">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
          <div class="space-y-4">
            <div
              class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div class="flex items-start gap-3">
                <ExclamationTriangleIcon class="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div class="flex-1">
                  <p class="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                    {{ $t("admin.posts.translateDialog.important") }}
                  </p>
                  <ul class="text-xs text-yellow-700 dark:text-yellow-400 space-y-1 list-disc list-inside">
                    <li>{{ $t("admin.posts.translateDialog.hint1") }}</li>
                    <li>{{ $t("admin.posts.translateDialog.hint2") }}</li>
                    <li>{{ $t("admin.posts.translateDialog.hint3") }}</li>
                  </ul>
                </div>
              </div>
            </div>
            <div>
              <p class="text-sm text-muted mb-4">
                {{ $t("admin.posts.translateDialog.articleTitle")
                }}<span class="font-medium">{{
                  translateDialog.articleTitle
                  }}</span>
              </p>

              <!-- 源语言选择 -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-muted mb-2">
                  {{ $t("admin.posts.translateDialog.sourceLanguage") }}
                  <span class="text-red-500">*</span>
                </label>
                <AppSelect v-model="translateDialog.sourceLanguageCode"
                  :options="translateDialog.availableSourceLanguages" :placeholder="$t('admin.posts.translateDialog.selectSourceLanguage')
                    " />
                <p class="mt-1 text-xs text-muted">
                  {{ $t("admin.posts.translateDialog.sourceLanguageHint") }}
                </p>
              </div>

              <!-- 目标语言选择 -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-sm font-medium text-muted">
                    {{ $t("admin.posts.translateDialog.targetLanguages") }}
                    <span class="text-red-500">*</span>
                  </label>
                  <div class="flex gap-2">
                    <button type="button" @click="
                      translateDialog.targetLanguageCodes =
                      translateDialog.availableTargetLanguages.map(
                        (l) => l.code
                      )
                      " class="text-xs text-primary-600 hover:underline">
                      {{ $t("admin.posts.translateDialog.selectAll") }}
                    </button>
                    <span class="text-xs text-gray-400">|</span>
                    <button type="button" @click="translateDialog.targetLanguageCodes = []"
                      class="text-xs text-primary-600 hover:underline">
                      {{ $t("admin.posts.translateDialog.deselectAll") }}
                    </button>
                  </div>
                </div>
                <div class="w-full max-h-48 overflow-y-auto border border-border rounded-lg bg-surface p-2 space-y-1">
                  <label v-for="lang in translateDialog.availableTargetLanguages" :key="lang.code"
                    class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-muted cursor-pointer">
                    <input type="checkbox" :value="lang.code" v-model="translateDialog.targetLanguageCodes"
                      class="w-4 h-4 text-primary-600 border-border rounded focus:ring-primary-500" />
                    <span class="text-sm text-foreground">
                      {{ lang.nativeName || lang.name }} ({{ lang.code }})
                    </span>
                  </label>
                  <p v-if="translateDialog.availableTargetLanguages.length === 0" class="text-xs text-muted px-2 py-1">
                    {{ $t("admin.posts.translateDialog.noTargetLanguages") }}
                  </p>
                </div>
                <p class="mt-1 text-xs text-muted">
                  {{ $t("admin.posts.translateDialog.targetLanguagesHint") }}
                </p>
              </div>

              <!-- 翻译渠道选择 -->
              <div>
                <label class="block text-sm font-medium text-muted mb-2">
                  {{ $t("admin.posts.translateDialog.provider") }}
                </label>
                <AppSelect v-model="translateDialog.providerId" :options="translationProviderOptions" :placeholder="$t('admin.posts.translateDialog.useDefaultProvider')
                  " />
                <p class="mt-1 text-xs text-muted">
                  {{ $t("admin.posts.translateDialog.providerHint") }}
                </p>
              </div>
            </div>
            <div class="flex justify-end gap-2">
              <button type="button" @click="translateDialog.show = false"
                class="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium">
                {{ $t("admin.posts.translateDialog.cancel") }}
              </button>
              <button type="button" @click="confirmTranslate"
                :disabled="translatingArticles.has(translateDialog.articleId)"
                class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2">
                <ArrowPathIcon v-if="translatingArticles.has(translateDialog.articleId)" class="w-4 h-4 animate-spin" />
                {{
                  translatingArticles.has(translateDialog.articleId)
                    ? $t("admin.posts.translateDialog.translating")
                    : $t("admin.posts.translateDialog.confirm")
                }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- AI生成文章对话框 -->
      <div v-if="showGenerateArticleModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div
          class="bg-surface text-foreground rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border border-border"
          @click.stop>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-foreground">
              {{ $t("admin.posts.generateArticleDialog.title") }}
            </h3>
            <button type="button" @click="showGenerateArticleModal = false"
              class="text-muted hover:text-foreground transition-colors">
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>

          <form @submit.prevent="generateArticle" class="space-y-4">
            <!-- 文章标题 -->
            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                {{ $t("admin.posts.generateArticleDialog.articleTitle") }}
                <span class="text-red-500">*</span>
              </label>
              <input v-model="generateArticleForm.title" type="text" required
                class="w-full p-1 md:px-3 md:py-2 border border-border rounded-lg bg-surface text-foreground"
                :placeholder="$t('admin.posts.generateArticleDialog.articleTitlePlaceholder')
                  " />
              <p class="mt-1 text-xs text-muted">
                {{ $t("admin.posts.generateArticleDialog.articleTitleHint") }}
              </p>
            </div>

            <!-- 内容要求 -->
            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                {{ $t("admin.posts.generateArticleDialog.contentRequirement") }}
                <span class="text-red-500">*</span>
              </label>
              <textarea v-model="generateArticleForm.contentRequirement" rows="6" required
                class="w-full p-1 md:px-3 md:py-2 border border-border rounded-lg bg-surface text-foreground"
                :placeholder="$t(
                  'admin.posts.generateArticleDialog.contentRequirementPlaceholder'
                )
                  "></textarea>
              <p class="mt-1 text-xs text-muted">
                {{
                  $t("admin.posts.generateArticleDialog.contentRequirementHint")
                }}
              </p>
            </div>

            <!-- 文章语言 -->
            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                {{ $t("admin.posts.generateArticleDialog.language") }}
                <span class="text-red-500">*</span>
              </label>
              <AppSelect v-model="generateArticleForm.languageCode" :options="languageOptions" :placeholder="$t('admin.posts.generateArticleDialog.selectLanguage')
                " />
              <p class="mt-1 text-xs text-muted">
                {{ $t("admin.posts.generateArticleDialog.languageHint") }}
              </p>
            </div>

            <!-- AI服务商选择 -->
            <div>
              <label class="block text-sm font-medium text-muted mb-1">
                {{ $t("admin.posts.generateArticleDialog.aiProvider") }}
              </label>
              <AppSelect v-model="generateArticleForm.providerId" :options="aiProviderOptions" :placeholder="$t('admin.posts.generateArticleDialog.useDefaultProvider')
                " placement="top" />
              <p class="mt-1 text-xs text-muted">
                {{ $t("admin.posts.generateArticleDialog.aiProviderHint") }}
              </p>
            </div>

            <!-- 错误提示 -->
            <div v-if="generateArticleError"
              class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
              {{ generateArticleError }}
            </div>

            <!-- 操作按钮 -->
            <div class="flex justify-end gap-2 pt-4">
              <button type="button" @click="showGenerateArticleModal = false"
                class="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors text-sm font-medium">
                {{ $t("common.cancel") }}
              </button>
              <button type="submit" :disabled="generatingArticle"
                class="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2">
                <ArrowPathIcon v-if="generatingArticle" class="w-4 h-4 animate-spin" />
                <SparklesIcon v-else class="w-4 h-4" />
                {{
                  generatingArticle
                    ? $t("admin.posts.generateArticleDialog.generating")
                    : $t("admin.posts.generateArticleDialog.generate")
                }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- 访问趋势图组件 -->
    <ArticleVisitLine :show="visitAnalysisDialog.show" :article-id="visitAnalysisDialog.articleId"
      :article-title="visitAnalysisDialog.articleTitle" @close="visitAnalysisDialog.show = false" />

    <!-- 文章评论管理弹窗 -->
    <ArticleCommentsModal
      :show="commentsModal.show"
      :article-id="commentsModal.articleId"
      :article-title="commentsModal.articleTitle"
      @close="commentsModal.show = false"
    />

    <!-- AI 生成记录 -->
    <ArticleAiGenerationLogsModal
      :show="showAiGenerationLogsModal"
      @close="showAiGenerationLogsModal = false"
      @reuse="handleReuseAiGenerationLog"
      @edit-article="editArticle"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import {
  PlusIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  EyeIcon,
  LanguageIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  ChartBarIcon,
  SparklesIcon,
  ArrowUpTrayIcon,
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
  ChatBubbleLeftIcon,
  BookmarkIcon,
  ClockIcon,
} from "@heroicons/vue/24/outline";
import ArticleVisitLine from "~/components/common/ArticleVisitLine.vue";
import ArticleCommentsModal from "~/components/admin/ArticleCommentsModal.vue";
import ArticleAiGenerationLogsModal from "~/components/admin/ArticleAiGenerationLogsModal.vue";
import type { AiGenerationLogItem } from "~/components/admin/ArticleAiGenerationLogsModal.vue";
import { splitSearchKeywords } from "~~/utils/search-keywords";

definePageMeta({
  layout: "admin",
  requiresAuth: true,
  middleware: ["auth", "creator"],
});
const { t, locale } = useI18n();

interface LanguageItem {
  id: string;
  code: string;
  name: string;
  nativeName?: string;
}

interface ArticleItem {
  id: string;
  contentId?: string;
  title: string;
  slug: string;
  featuredImage: string | null;
  status: string;
  isPublished: boolean;
  viewCount?: number;
  bookmarkCount?: number;
  pinOrder?: number;
  updatedAt: string;
  languageCode?: string;
  language?: {
    code: string;
    name: string;
  };
  categorySlug?: string;
  tagSlugs?: string[];
  availableLanguages?: string[]; // 该文章已具备的语言代码列表
}

const router = useRouter();
const localePath = useLocalePath();

const languages = ref<LanguageItem[]>([]);
const articles = ref<ArticleItem[]>([]);
const listLoading = ref(true);
const loadingMore = ref(false);
const hasMore = ref(true);
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

const dictionaryStore = useDictionaryStore();

// 标签列表（用于筛选下拉）
interface TagItem {
  id: string;
  slug: string;
  name: string;
  languageCode: string;
}
const tags = ref<TagItem[]>([]);

// 分类列表（用于筛选下拉）
interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  languageCode: string;
}
const categories = ref<CategoryItem[]>([]);

// 翻译服务商列表
interface TranslationProvider {
  id: string;
  name: string;
  provider: string;
  isActive: boolean;
  priority: number;
}

const translationProviders = ref<TranslationProvider[]>([]);
const aiProviders = ref<TranslationProvider[]>([]);

const filters = reactive({
  search: "",
  published: "ALL", // "ALL" | "true" | "false"
  categorySlug: "",
  tagSlug: "",
  sortBy: "createdAt", // "createdAt" | "viewCount" | "updatedAt"
  sortOrder: "desc", // "asc" | "desc"
});

// 消息提示
const message = reactive({
  text: "",
  type: "success" as "success" | "error",
});

const messageClass = computed(() =>
  message.type === "success"
    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
);

const setMessage = (text: string, type: "success" | "error" = "error") => {
  message.text = text;
  message.type = type;
  setTimeout(() => {
    message.text = "";
  }, 4000);
};

// 翻译相关状态
const translatingArticles = ref<Set<string>>(new Set());
const translateDialog = reactive({
  show: false,
  articleId: "",
  articleTitle: "",
  sourceLanguageCode: "",
  sourceLanguageName: "",
  providerId: "", // 选中的翻译服务商ID，空字符串表示使用系统默认
  targetLanguageCodes: [] as string[], // 选中的目标语言代码列表
  availableSourceLanguages: [] as { value: string; label: string }[], // 可用的源语言列表（文章已具备的语言版本）
  availableTargetLanguages: [] as LanguageItem[], // 可用的目标语言列表（排除源语言）
});

// 删除相关状态
const deletingArticles = ref<Set<string>>(new Set());
const deleteDialog = reactive({
  show: false,
  articleId: "",
  articleTitle: "",
});

// 发布相关状态
const publishingArticles = ref<Set<string>>(new Set());

// 置顶相关状态
const pinningArticles = ref<Set<string>>(new Set());

// 访问趋势分析相关状态
const visitAnalysisDialog = reactive({
  show: false,
  articleId: "",
  articleTitle: "",
});

// 评论管理弹窗
const commentsModal = reactive({
  show: false,
  articleId: "",
  articleTitle: "",
});

// AI生成文章相关状态
const showGenerateArticleModal = ref(false);
const showAiGenerationLogsModal = ref(false);
const generatingArticle = ref(false);
const generateArticleError = ref("");
const generateArticleForm = ref({
  title: "",
  languageCode: "",
  contentRequirement: "",
  providerId: "",
});

// 获取分类名称（使用文章内容的语言代码，如果为空则回退到默认语言）
const getCategoryName = (article: ArticleItem) => {
  if (!article.categorySlug) return "";
  // 如果 languageCode 为空，使用默认语言 "zh"
  const langCode = article.languageCode || "zh";
  return dictionaryStore.getCategoryName(article.categorySlug, langCode);
};

// 获取标签名称（如果 languageCode 为空则回退到默认语言）
const getTagName = (tagSlug: string, languageCode: string) => {
  // 如果 languageCode 为空，使用默认语言 "zh"
  const langCode = languageCode || "zh";
  return dictionaryStore.getTagName(tagSlug, langCode);
};

// 获取语言名称（用于显示）
const getLanguageName = (code: string) => {
  const lang = languages.value.find((l) => l.code === code);
  return lang ? `${lang.name} (${lang.nativeName || lang.code})` : code;
};

// 获取语言显示名称（简短版本，用于标签显示）
const getLanguageDisplayName = (code: string) => {
  const lang = languages.value.find((l) => l.code === code);
  return lang ? lang.nativeName || lang.name || code : code;
};

// 发布状态选项
const publishedStatusOptions = computed(() => [
  { value: "ALL", label: t("admin.posts.filters.allStatus") },
  { value: "false", label: t("admin.posts.filters.draft") },
  { value: "true", label: t("admin.posts.filters.published") },
]);

// 语言选项
const languageOptions = computed(() => {
  return languages.value.map((lang) => ({
    value: lang.code,
    label: `${lang.nativeName || lang.name} (${lang.code})`,
  }));
});

// 排序字段选项
const sortByOptions = computed(() => [
  {
    value: "createdAt",
    label: t("admin.posts.filters.sortOptions.createdAt"),
  },
  {
    value: "viewCount",
    label: t("admin.posts.filters.sortOptions.viewCount"),
  },
  {
    value: "updatedAt",
    label: t("admin.posts.filters.sortOptions.updatedAt"),
  },
]);

// 排序方向选项
const sortOrderOptions = computed(() => [
  {
    value: "desc",
    label: t("admin.posts.filters.sortOrderOptions.desc"),
  },
  {
    value: "asc",
    label: t("admin.posts.filters.sortOrderOptions.asc"),
  },
]);

// 标签筛选选项：按 slug 去重，标签名优先用当前语言的 name
const tagOptions = computed(() => {
  const loc = locale?.value ?? "zh";
  const bySlug = new Map<string, string>();
  for (const tag of tags.value) {
    if (!bySlug.has(tag.slug)) bySlug.set(tag.slug, tag.name);
    else if (tag.languageCode === loc) bySlug.set(tag.slug, tag.name);
  }
  return [
    { value: "", label: t("admin.posts.filters.allTags") },
    ...Array.from(bySlug.entries()).map(([value, label]) => ({ value, label })),
  ].sort((a, b) => (a.label || "").localeCompare(b.label || ""));
});

// 分类筛选选项：按 slug 去重，名称优先用当前语言
const categoryOptions = computed(() => {
  const loc = locale?.value ?? "zh";
  const bySlug = new Map<string, string>();
  for (const cat of categories.value) {
    if (!bySlug.has(cat.slug)) bySlug.set(cat.slug, cat.name);
    else if (cat.languageCode === loc) bySlug.set(cat.slug, cat.name);
  }
  return [
    { value: "", label: t("admin.posts.filters.allCategories") },
    ...Array.from(bySlug.entries()).map(([value, label]) => ({ value, label })),
  ].sort((a, b) => (a.label || "").localeCompare(b.label || ""));
});

// 翻译提供商选项
const translationProviderOptions = computed(() => {
  return translationProviders.value.map((provider) => ({
    value: provider.id,
    label: `${provider.name} (${provider.provider})`,
  }));
});

const aiProviderOptions = computed(() => {
  return aiProviders.value.map((provider) => ({
    value: provider.id,
    label: `${provider.name} (${provider.provider})`,
  }));
});

const getStatusClass = (article: ArticleItem) => {
  if (article.isPublished) {
    return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
  }
  return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
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

const loadTags = async () => {
  try {
    const response: any = await $fetch("/api/creator/tags");
    if (response?.c === 200 && response.d?.items) {
      tags.value = response.d.items;
    }
  } catch (error) {
    console.error("加载标签失败", error);
  }
};

const loadCategories = async () => {
  try {
    const response: any = await $fetch("/api/creator/categories");
    if (response?.c === 200 && response.d?.items) {
      categories.value = response.d.items;
    }
  } catch (error) {
    console.error("加载分类失败", error);
  }
};

/**
 * 将搜索框输入映射为 `/api/creator/articles` 的查询参数。
 * - `id:` / `slug:` 前缀：按 ID 或 slug **精确**筛选（与后端一致）。
 * - 无前缀：一律走 `search`，后端按空格/顿号/逗号拆成多个关键词，对 **标题与 slug** 做不区分大小写的包含匹配，且每个词都必须命中。
 * 不再把「像 slug 的单词」自动当成精确 slug，避免只输英文/拼音时搜不到标题。
 */
function articleListSearchQuery(raw: string): Record<string, string> {
  const input = raw.trim();
  if (!input) return {};

  const idPrefixed = input.match(/^id\s*:\s*(.+)$/i);
  if (idPrefixed?.[1]) return { id: idPrefixed[1].trim() };

  const slugPrefixed = input.match(/^slug\s*:\s*(.+)$/i);
  if (slugPrefixed?.[1]) return { slug: slugPrefixed[1].trim() };

  const looksLikeUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      input
    );
  // Prisma @default(cuid()) 常见形态（勿用「任意 16+ 位字母串」，易与英文单词冲突）
  const looksLikeCuid = /^c[0-9a-z]{24}$/.test(input);
  if (looksLikeUuid || looksLikeCuid) return { id: input };

  return { search: input };
}

const parsedSearchKeywords = computed(() => {
  const query = articleListSearchQuery(filters.search || "");
  if (!query.search) return [];
  return splitSearchKeywords(query.search);
});

const loadArticles = async (page?: number, append: boolean = false) => {
  // 如果指定了 page，使用指定的 page；否则使用当前的 pagination.page
  const targetPage = page !== undefined ? page : pagination.page;

  // 如果是第一页或者是重新加载，显示主加载状态
  if (targetPage === 1 || !append) {
    listLoading.value = true;
    loadingMore.value = false;
  } else {
    // 否则显示加载更多状态
    if (loadingMore.value || listLoading.value) return;
    loadingMore.value = true;
  }

  try {
    const searchQuery = articleListSearchQuery(filters.search || "");

    const query: any = {
      page: targetPage,
      pageSize: pagination.pageSize,
      ...searchQuery,
      languageCode: locale?.value || "zh",
      categorySlug: filters.categorySlug || undefined,
      tagSlug: filters.tagSlug || undefined,
      sortBy: filters.sortBy || "createdAt",
      sortOrder: filters.sortOrder || "desc",
    };

    // 根据 published 筛选
    if (filters.published === "true") {
      query.isPublished = true;
    } else if (filters.published === "false") {
      query.isPublished = false;
    }
    // "ALL" 时不传 isPublished 参数，返回所有状态

    const response: any = await $fetch("/api/creator/articles", { query });

    if (response?.c === 200) {
      if (append) {
        articles.value.push(...response.d.items);
      } else {
        articles.value = response.d.items;
      }
      Object.assign(pagination, response.d.pagination);
      hasMore.value =
        pagination.page < Math.ceil(pagination.total / pagination.pageSize);
      // 字典数据在系统初始化时已全部加载，直接使用即可
    }
  } catch (err: any) {
    console.error("加载文章失败", err);
  } finally {
    listLoading.value = false;
    loadingMore.value = false;
    // 数据加载完成后，重新设置 observer
    if (hasMore.value && articles.value.length > 0) {
      nextTick(() => {
        if (loadMoreTrigger.value && observer) {
          observer.disconnect();
          observer.observe(loadMoreTrigger.value);
        }
      });
    }
  }
};

const startCreate = () => {
  router.push(localePath("/admin/editpost"));
};

const editArticle = (id: string) => {
  router.push(`${localePath("/admin/editpost")}?id=${id}`);
};

const formatDate = (date: string | null) => {
  if (!date) return "-";
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return t("admin.posts.date.today");
  } else if (days === 1) {
    return t("admin.posts.date.yesterday");
  } else if (days < 7) {
    return t("admin.posts.date.daysAgo", { days });
  } else {
    return d.toLocaleDateString();
  }
};

const formatStatus = (article: ArticleItem) => {
  return article.isPublished
    ? t("admin.posts.status.published")
    : t("admin.posts.status.draft");
};

const getArticleUrl = (article: ArticleItem) => {
  // 获取语言代码，优先使用 languageCode，然后是 language.code
  let langCode = "zh"; // 默认中文
  if (article.languageCode) {
    langCode = article.languageCode;
  } else if (article.language?.code) {
    langCode = article.language.code;
  }

  // 构建文章URL（默认语言zh不需要前缀）
  if (langCode === "zh") {
    return `/post/${article.slug}`;
  }
  return `/${langCode}/post/${article.slug}`;
};

// 加载翻译服务商列表
const loadTranslationProviders = async () => {
  try {
    const response: any = await $fetch("/api/creator/translations");
    if (response?.c === 200) {
      translationProviders.value = (response.d || [])
        .filter((p: TranslationProvider) => p.isActive)
        .sort(
          (a: TranslationProvider, b: TranslationProvider) =>
            b.priority - a.priority
        );
    }
  } catch (error) {
    console.error("加载翻译服务商列表失败:", error);
  }
};

const loadAiProviders = async () => {
  try {
    const response: any = await $fetch("/api/creator/ai-configs");
    if (response?.c === 200) {
      aiProviders.value = (response.d || [])
        .filter((p: TranslationProvider) => p.isActive)
        .sort(
          (a: TranslationProvider, b: TranslationProvider) =>
            b.priority - a.priority
        );
    }
  } catch (error) {
    console.error("加载AI服务商列表失败:", error);
  }
};

// 处理翻译
const handleTranslate = (article: ArticleItem) => {
  // 获取文章已具备的语言版本
  const availableLanguageCodes =
    article.availableLanguages && article.availableLanguages.length > 0
      ? article.availableLanguages
      : article.languageCode
        ? [article.languageCode]
        : [];

  if (availableLanguageCodes.length === 0) {
    setMessage(t("admin.posts.messages.noLanguageVersion"), "error");
    return;
  }

  translateDialog.articleId = article.id;
  translateDialog.articleTitle = article.title;
  translateDialog.providerId = ""; // 重置为默认

  // 构建可用的源语言列表（文章已具备的语言版本）
  translateDialog.availableSourceLanguages = availableLanguageCodes
    .map((code) => {
      const lang = languages.value.find((l) => l.code === code);
      return {
        value: code,
        label: lang ? `${lang.nativeName || lang.name} (${lang.code})` : code,
      };
    })
    .filter((item) => item.value); // 过滤掉无效项

  // 默认使用文章当前语言作为源语言
  const defaultSourceCode =
    article.languageCode || availableLanguageCodes[0] || "";
  translateDialog.sourceLanguageCode = defaultSourceCode;

  // 更新源语言名称和可用目标语言
  updateSourceLanguageAndTargets(defaultSourceCode);

  translateDialog.show = true;
};

// 更新源语言和可用目标语言列表
const updateSourceLanguageAndTargets = (sourceCode: string) => {
  const lang = languages.value.find((l) => l.code === sourceCode);
  translateDialog.sourceLanguageName = lang
    ? `${lang.nativeName || lang.name} (${lang.code})`
    : sourceCode;

  // 计算可用的目标语言：排除源语言本身
  translateDialog.availableTargetLanguages = languages.value.filter(
    (l) => l.code !== sourceCode
  );

  // 如果当前选中的目标语言中包含源语言，则移除
  translateDialog.targetLanguageCodes =
    translateDialog.targetLanguageCodes.filter((code) => code !== sourceCode);

  // 如果目标语言列表为空，默认选中所有可用语言
  if (translateDialog.targetLanguageCodes.length === 0) {
    translateDialog.targetLanguageCodes =
      translateDialog.availableTargetLanguages.map((l) => l.code);
  }
};

// 确认翻译
const confirmTranslate = async () => {
  const articleId = translateDialog.articleId;
  const sourceLanguageCode = translateDialog.sourceLanguageCode;

  if (!articleId || !sourceLanguageCode) {
    return;
  }

  // 验证是否选择了目标语言
  if (
    !translateDialog.targetLanguageCodes ||
    translateDialog.targetLanguageCodes.length === 0
  ) {
    setMessage(t("admin.posts.messages.selectTargetLanguages"), "error");
    return;
  }

  translatingArticles.value.add(articleId);

  try {
    const body: any = {
      sourceLanguageCode,
      targetLanguageCodes: translateDialog.targetLanguageCodes,
    };

    // 如果选择了翻译服务商，传递providerId
    if (translateDialog.providerId) {
      body.providerId = translateDialog.providerId;
    }

    const response: any = await $fetch(
      `/api/creator/articles/${articleId}/translate-all`,
      {
        method: "POST",
        body,
      }
    );

    if (response?.c === 200) {
      translateDialog.show = false;
      setMessage(t("admin.posts.messages.translateStarted"), "success");
      // 刷新列表以更新已存在的语言版本
      await loadArticles(1, false);
    } else {
      setMessage(
        response?.m || t("admin.posts.messages.translateFailed"),
        "error"
      );
    }
  } catch (err: any) {
    setMessage(
      err?.message || t("admin.posts.messages.translateFailed"),
      "error"
    );
  } finally {
    translatingArticles.value.delete(articleId);
  }
};

// 打开评论管理弹窗
const openCommentsModal = (article: ArticleItem) => {
  commentsModal.articleId = article.id;
  commentsModal.articleTitle = article.title;
  commentsModal.show = true;
};

// 处理访问趋势分析
const handleVisitAnalysis = (article: ArticleItem) => {
  visitAnalysisDialog.articleId = article.id;
  visitAnalysisDialog.articleTitle = article.title;
  visitAnalysisDialog.show = true;
};

// 处理发布
const handlePublish = async (article: ArticleItem) => {
  const articleId = article.id;

  if (!articleId) {
    return;
  }

  publishingArticles.value.add(articleId);

  try {
    const response: any = await $fetch(`/api/creator/articles/${articleId}`, {
      method: "PATCH",
      body: {
        isPublished: true,
      },
    });

    if (response?.c === 200) {
      setMessage(t("admin.posts.messages.publishSuccess"), "success");
      // 刷新列表
      await loadArticles(pagination.page, false);
    } else {
      setMessage(
        response?.m || t("admin.posts.messages.publishFailed"),
        "error"
      );
    }
  } catch (err: any) {
    setMessage(
      err?.data?.m || err?.message || t("admin.posts.messages.publishFailed"),
      "error"
    );
  } finally {
    publishingArticles.value.delete(articleId);
  }
};

// 处理置顶
const handlePin = async (article: ArticleItem) => {
  const articleId = article.id;
  if (!articleId) return;

  pinningArticles.value.add(articleId);
  try {
    const response: any = await $fetch(`/api/creator/articles/${articleId}/pin`, {
      method: "POST",
    });
    if (response?.c === 200) {
      setMessage(t("admin.posts.messages.pinSuccess"), "success");
      await loadArticles(pagination.page, false);
    } else {
      setMessage(response?.m || t("admin.posts.messages.pinFailed"), "error");
    }
  } catch (err: any) {
    setMessage(err?.data?.m || err?.message || t("admin.posts.messages.pinFailed"), "error");
  } finally {
    pinningArticles.value.delete(articleId);
  }
};

// 处理取消置顶
const handleUnpin = async (article: ArticleItem) => {
  const articleId = article.id;
  if (!articleId) return;

  pinningArticles.value.add(articleId);
  try {
    const response: any = await $fetch(`/api/creator/articles/${articleId}/unpin`, {
      method: "POST",
    });
    if (response?.c === 200) {
      setMessage(t("admin.posts.messages.unpinSuccess"), "success");
      await loadArticles(pagination.page, false);
    } else {
      setMessage(response?.m || t("admin.posts.messages.unpinFailed"), "error");
    }
  } catch (err: any) {
    setMessage(err?.data?.m || err?.message || t("admin.posts.messages.unpinFailed"), "error");
  } finally {
    pinningArticles.value.delete(articleId);
  }
};

// 处理删除
const handleDelete = (article: ArticleItem) => {
  deleteDialog.articleId = article.id;
  deleteDialog.articleTitle = article.title;
  deleteDialog.show = true;
};

// 确认删除
const confirmDelete = async () => {
  const articleId = deleteDialog.articleId;

  if (!articleId) {
    return;
  }

  deletingArticles.value.add(articleId);

  try {
    const response: any = await $fetch(`/api/creator/articles/${articleId}`, {
      method: "DELETE",
    });

    if (response?.c === 200) {
      deleteDialog.show = false;
      setMessage(t("admin.posts.messages.deleteSuccess"), "success");
      // 刷新列表
      await loadArticles(1, false);
    } else {
      setMessage(
        response?.m || t("admin.posts.messages.deleteFailed"),
        "error"
      );
    }
  } catch (err: any) {
    setMessage(err?.message || t("admin.posts.messages.deleteFailed"), "error");
  } finally {
    deletingArticles.value.delete(articleId);
  }
};

// 复用历史 AI 生成提交参数
const handleReuseAiGenerationLog = (log: AiGenerationLogItem) => {
  generateArticleForm.value = {
    title: log.title,
    languageCode: log.languageCode,
    contentRequirement: log.contentRequirement,
    providerId: log.providerId || "",
  };
  generateArticleError.value = "";
  showGenerateArticleModal.value = true;
};

// AI生成文章
const generateArticle = async () => {
  if (!generateArticleForm.value.title.trim()) {
    generateArticleError.value = t("admin.posts.messages.articleTitleRequired");
    return;
  }

  if (!generateArticleForm.value.languageCode) {
    generateArticleError.value = t("admin.posts.messages.languageRequired");
    return;
  }

  if (!generateArticleForm.value.contentRequirement.trim()) {
    generateArticleError.value = t(
      "admin.posts.messages.contentRequirementRequired"
    );
    return;
  }

  generatingArticle.value = true;
  generateArticleError.value = "";

  try {
    const body: any = {
      title: generateArticleForm.value.title,
      languageCode: generateArticleForm.value.languageCode,
      contentRequirement: generateArticleForm.value.contentRequirement,
    };

    // 如果选择了AI服务商，传递providerId
    if (generateArticleForm.value.providerId) {
      body.providerId = generateArticleForm.value.providerId;
    }

    const response: any = await $fetch(
      "/api/creator/articles/generate-with-ai",
      {
        method: "POST",
        body,
      }
    );

    if (response?.c === 200) {
      setMessage(t("admin.posts.messages.generateSuccess"), "success");
      showGenerateArticleModal.value = false;
      // 重置表单
      generateArticleForm.value = {
        title: "",
        languageCode: "",
        contentRequirement: "",
        providerId: "",
      };
      // 刷新文章列表
      await loadArticles(1, false);
      // 自动跳转到编辑页面
      if (response.d?.id) {
        setTimeout(() => {
          editArticle(response.d.id);
        }, 500);
      }
    } else {
      generateArticleError.value =
        response?.m || t("admin.posts.messages.generateFailed");
    }
  } catch (err: any) {
    console.error("生成文章失败:", err);
    generateArticleError.value =
      err?.data?.m || err?.message || t("admin.posts.messages.generateFailed");
  } finally {
    generatingArticle.value = false;
  }
};

// 无限滚动：使用 Intersection Observer
const loadMoreTrigger = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

// 设置无限滚动 observer
const setupInfiniteScroll = () => {
  // 先断开旧的 observer
  if (observer) {
    observer.disconnect();
  }

  // 创建新的 observer
  observer = new IntersectionObserver(
    (entries) => {
      if (
        entries[0]?.isIntersecting &&
        hasMore.value &&
        !loadingMore.value &&
        !listLoading.value
      ) {
        loadArticles(pagination.page + 1, true);
      }
    },
    {
      rootMargin: "100px",
    }
  );

  // 在下一个 tick 观察 trigger 元素
  nextTick(() => {
    if (loadMoreTrigger.value && hasMore.value && articles.value.length > 0) {
      observer?.observe(loadMoreTrigger.value);
    }
  });
};

// 监听源语言变化，更新目标语言列表
watch(
  () => translateDialog.sourceLanguageCode,
  (newSourceCode) => {
    if (newSourceCode && translateDialog.show) {
      updateSourceLanguageAndTargets(newSourceCode);
    }
  }
);

// 监听筛选条件变化，重新加载第一页
watch(
  () => [
    filters.search,
    filters.published,
    filters.categorySlug,
    filters.tagSlug,
    filters.sortBy,
    filters.sortOrder,
  ],
  () => {
    pagination.page = 1;
    loadArticles(1, false);
  },
  { deep: true }
);

// 监听数据变化，重新设置 observer
watch([hasMore, () => articles.value.length], () => {
  if (hasMore.value && articles.value.length > 0) {
    nextTick(() => {
      if (loadMoreTrigger.value && observer) {
        observer.disconnect();
        observer.observe(loadMoreTrigger.value);
      }
    });
  }
});

onMounted(async () => {
  console.log("[posts] mounted, start loading data");
  // 确保字典数据已加载（app.vue 中可能还未加载完成）
  await dictionaryStore.loadDictionaries();
  await Promise.all([
    loadLanguages(),
    loadTags(),
    loadCategories(),
    loadArticles(1, false),
    loadTranslationProviders(),
    loadAiProviders(),
  ]);
  // 设置无限滚动
  setupInfiniteScroll();
});

onUnmounted(() => {
  observer?.disconnect();
});
</script>
