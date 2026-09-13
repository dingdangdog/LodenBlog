<template>
  <div
    class="relative isolate min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background text-foreground"
  >
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary-500/10 blur-3xl"></div>
      <div class="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-accent-500/10 blur-3xl"></div>
    </div>

    <div class="relative z-10 max-w-2xl w-full">
      <!-- 步骤指示器 -->
      <div class="mb-8">
        <div class="flex items-center justify-center">
          <div
            v-for="(step, index) in steps"
            :key="index"
            class="flex items-center"
          >
            <div class="flex flex-col items-center">
              <div
                :class="[
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                  currentStep > index
                    ? 'bg-green-500 text-white'
                    : currentStep === index
                    ? 'bg-primary-600 text-white ring-4 ring-primary-500/30'
                    : 'bg-surface-muted text-muted border border-border',
                ]"
              >
                <span v-if="currentStep > index">✓</span>
                <span v-else>{{ index + 1 }}</span>
              </div>
              <span
                class="mt-2 text-xs font-medium text-muted"
              >
                {{ $t(`setup.steps.${step.key}`) }}
              </span>
            </div>
            <div
              v-if="index < steps.length - 1"
              :class="[
                'w-16 h-1 mx-2 transition-all',
                currentStep > index ? 'bg-green-500' : 'bg-surface-muted',
              ]"
            ></div>
          </div>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="bg-surface text-foreground rounded-2xl shadow-xl p-8 border border-border">
        <div
          v-if="errorMessage"
          class="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-700 dark:text-red-300"
        >
          {{ errorMessage }}
        </div>

        <!-- 步骤 1: 欢迎 -->
        <div v-if="currentStep === 0" class="space-y-6">
          <div class="text-center">
            <h2 class="text-3xl font-bold text-foreground mb-4">
              🎉 {{ $t("setup.step1.title") }}
            </h2>
            <p class="text-lg text-muted mb-8">
              {{ $t("setup.step1.subtitle") }}
            </p>
          </div>

          <div class="bg-surface-muted rounded-lg p-6 space-y-4">
            <h3 class="text-lg font-semibold text-foreground">
              {{ $t("setup.step1.selectPrimaryLanguage") }}
            </h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <button
                v-for="lang in languages"
                :key="lang.code"
                type="button"
                @click="selectLanguage(lang.code)"
                :class="[
                  'p-3 rounded-lg border-2 transition-all text-center',
                  form.defaultLang === lang.code
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-border hover:border-primary-500/50',
                ]"
              >
                <div class="text-2xl mb-1">{{ lang.flag }}</div>
                <div class="font-medium text-foreground text-sm">
                  {{ lang.nativeName }}
                </div>
                <div class="text-xs text-muted">
                  {{ lang.name }}
                </div>
              </button>
            </div>

            <h3 class="text-lg font-semibold text-foreground mt-6">
              {{ $t("setup.step1.selectEnabledLanguages") }}
            </h3>
            <p class="text-sm text-muted">
              {{ $t("setup.step1.enabledLanguagesHint") }}
            </p>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <button
                v-for="lang in languages"
                :key="'enabled-' + lang.code"
                type="button"
                @click="toggleEnabledLanguage(lang.code)"
                :class="[
                  'p-3 rounded-lg border-2 transition-all text-center',
                  form.enabledLanguages.includes(lang.code)
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-border hover:opacity-80 opacity-70',
                ]"
              >
                <div class="text-2xl mb-1">{{ lang.flag }}</div>
                <div class="font-medium text-foreground text-sm">
                  {{ lang.nativeName }}
                </div>
                <div class="text-xs text-muted">
                  {{ form.enabledLanguages.includes(lang.code) ? $t("setup.step1.enabled") : $t("setup.step1.disabled") }}
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- 步骤 2: 网站 SEO 信息 -->
        <div v-if="currentStep === 1" class="space-y-6">
          <div class="text-center mb-8">
            <h2 class="text-2xl font-bold text-foreground mb-2">
              📝 {{ $t("setup.step2.title") }}
            </h2>
            <p class="text-muted">
              {{ $t("setup.step2.subtitle") }}
            </p>
          </div>

          <div class="space-y-5">
            <div>
              <label
                for="siteTitle"
                class="block text-sm font-medium text-muted mb-2"
              >
                {{ $t("setup.step2.siteTitle") }}
                <span class="text-red-500">*</span>
              </label>
              <input
                id="siteTitle"
                v-model="form.siteTitle"
                type="text"
                required
                :placeholder="$t('setup.step2.siteTitlePlaceholder')"
                class="block w-full px-4 py-3 border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-surface text-foreground"
              />
              <p class="mt-1 text-xs text-muted">
                {{ $t("setup.step2.siteTitleHelp") }}
              </p>
            </div>

            <div>
              <label
                for="siteDescription"
                class="block text-sm font-medium text-muted mb-2"
              >
                {{ $t("setup.step2.siteDescription") }}
                <span class="text-red-500">*</span>
              </label>
              <textarea
                id="siteDescription"
                v-model="form.siteDescription"
                required
                rows="4"
                :placeholder="$t('setup.step2.siteDescriptionPlaceholder')"
                class="block w-full px-4 py-3 border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-surface text-foreground"
              ></textarea>
              <p class="mt-1 text-xs text-muted">
                {{ $t("setup.step2.siteDescriptionHelp") }}
              </p>
            </div>

            <div>
              <label
                for="siteKeyword"
                class="block text-sm font-medium text-muted mb-2"
              >
                {{ $t("setup.step2.siteKeyword") }}
              </label>
              <input
                id="siteKeyword"
                v-model="form.siteKeyword"
                type="text"
                :placeholder="$t('setup.step2.siteKeywordPlaceholder')"
                class="block w-full px-4 py-3 border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-surface text-foreground"
              />
              <p class="mt-1 text-xs text-muted">
                {{ $t("setup.step2.siteKeywordHelp") }}
              </p>
            </div>

            <div>
              <label
                for="siteDomain"
                class="block text-sm font-medium text-muted mb-2"
              >
                {{ $t("setup.step2.siteDomain") }}
              </label>
              <input
                id="siteDomain"
                v-model="form.siteDomain"
                type="text"
                :placeholder="$t('setup.step2.siteDomainPlaceholder')"
                class="block w-full px-4 py-3 border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-surface text-foreground"
              />
              <p class="mt-1 text-xs text-muted">
                {{ $t("setup.step2.siteDomainHelp") }}
              </p>
            </div>
          </div>
        </div>

        <!-- 步骤 3: R2 存储配置 -->
        <div v-if="currentStep === 2" class="space-y-6">
          <div class="text-center mb-8">
            <h2 class="text-2xl font-bold text-foreground mb-2">
              ☁️ {{ $t("setup.stepR2.title") }}
            </h2>
            <p class="text-muted">
              {{ $t("setup.stepR2.subtitle") }}
            </p>
          </div>

          <div
            class="p-4 rounded-lg border border-primary-500/40 bg-primary-500/10 text-foreground mb-6"
          >
            <p class="text-sm text-muted">
              {{ $t("setup.stepR2.hint") }}
            </p>
          </div>

          <div class="space-y-5">
            <div>
              <label
                for="r2Url"
                class="block text-sm font-medium text-muted mb-2"
              >
                {{ $t("setup.stepR2.r2Url") }}
                <span class="text-red-500">*</span>
              </label>
              <input
                id="r2Url"
                v-model="form.r2Url"
                type="url"
                required
                :placeholder="$t('setup.stepR2.r2UrlPlaceholder')"
                class="block w-full px-4 py-3 border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-surface text-foreground"
              />
              <p class="mt-1 text-xs text-muted">
                {{ $t("setup.stepR2.r2UrlHelp") }}
              </p>
            </div>

            <div>
              <label
                for="r2SecretId"
                class="block text-sm font-medium text-muted mb-2"
              >
                {{ $t("setup.stepR2.r2SecretId") }}
                <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  id="r2SecretId"
                  v-model="form.r2SecretId"
                  :type="showR2SecretId ? 'text' : 'password'"
                  required
                  :placeholder="$t('setup.stepR2.r2SecretIdPlaceholder')"
                  class="block w-full px-4 py-3 pr-10 border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-surface text-foreground"
                />
                <button
                  type="button"
                  @click="showR2SecretId = !showR2SecretId"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                >
                  <EyeSlashIcon
                    v-if="showR2SecretId"
                    class="w-5 h-5"
                  />
                  <EyeIcon v-else class="w-5 h-5" />
                </button>
              </div>
              <p class="mt-1 text-xs text-muted">
                {{ $t("setup.stepR2.r2SecretIdHelp") }}
              </p>
            </div>

            <div>
              <label
                for="r2SecretKey"
                class="block text-sm font-medium text-muted mb-2"
              >
                {{ $t("setup.stepR2.r2SecretKey") }}
                <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  id="r2SecretKey"
                  v-model="form.r2SecretKey"
                  :type="showR2SecretKey ? 'text' : 'password'"
                  required
                  :placeholder="$t('setup.stepR2.r2SecretKeyPlaceholder')"
                  class="block w-full px-4 py-3 pr-10 border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-surface text-foreground"
                />
                <button
                  type="button"
                  @click="showR2SecretKey = !showR2SecretKey"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                >
                  <EyeSlashIcon
                    v-if="showR2SecretKey"
                    class="w-5 h-5"
                  />
                  <EyeIcon v-else class="w-5 h-5" />
                </button>
              </div>
              <p class="mt-1 text-xs text-muted">
                {{ $t("setup.stepR2.r2SecretKeyHelp") }}
              </p>
            </div>

            <div>
              <label
                for="r2Bucket"
                class="block text-sm font-medium text-muted mb-2"
              >
                {{ $t("setup.stepR2.r2Bucket") }}
                <span class="text-red-500">*</span>
              </label>
              <input
                id="r2Bucket"
                v-model="form.r2Bucket"
                type="text"
                required
                :placeholder="$t('setup.stepR2.r2BucketPlaceholder')"
                class="block w-full px-4 py-3 border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-surface text-foreground"
              />
              <p class="mt-1 text-xs text-muted">
                {{ $t("setup.stepR2.r2BucketHelp") }}
              </p>
            </div>

            <div>
              <label
                for="r2Token"
                class="block text-sm font-medium text-muted mb-2"
              >
                {{ $t("setup.stepR2.r2Token") }}
              </label>
              <div class="relative">
                <input
                  id="r2Token"
                  v-model="form.r2Token"
                  :type="showR2Token ? 'text' : 'password'"
                  :placeholder="$t('setup.stepR2.r2TokenPlaceholder')"
                  class="block w-full px-4 py-3 pr-10 border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-surface text-foreground"
                />
                <button
                  type="button"
                  @click="showR2Token = !showR2Token"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                >
                  <EyeSlashIcon
                    v-if="showR2Token"
                    class="w-5 h-5"
                  />
                  <EyeIcon v-else class="w-5 h-5" />
                </button>
              </div>
              <p class="mt-1 text-xs text-muted">
                {{ $t("setup.stepR2.r2TokenHelp") }}
              </p>
            </div>

            <div>
              <label
                for="r2Domain"
                class="block text-sm font-medium text-muted mb-2"
              >
                {{ $t("setup.stepR2.r2Domain") }}
              </label>
              <input
                id="r2Domain"
                v-model="form.r2Domain"
                type="url"
                :placeholder="$t('setup.stepR2.r2DomainPlaceholder')"
                class="block w-full px-4 py-3 border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-surface text-foreground"
              />
              <p class="mt-1 text-xs text-muted">
                {{ $t("setup.stepR2.r2DomainHelp") }}
              </p>
            </div>
          </div>
        </div>

        <!-- 步骤 4: Logo和图标设置 -->
        <div v-if="currentStep === 3" class="space-y-6">
          <div class="text-center mb-8">
            <h2 class="text-2xl font-bold text-foreground mb-2">
              🎨 {{ $t("setup.step2Logo.title") }}
            </h2>
            <p class="text-muted">
              {{ $t("setup.step2Logo.subtitle") }}
            </p>
          </div>

          <!-- Logo设置 -->
          <div class="space-y-4">
            <h3 class="text-lg font-semibold text-foreground">
              {{ $t("setup.step2Logo.logoSection.title") }}
            </h3>

            <div>
              <label
                class="block text-sm font-medium text-muted mb-2"
              >
                {{ $t("setup.step2Logo.logoSection.lightMode") }}
              </label>
              <div class="flex gap-3">
                <!-- 左侧预览区域 -->
                <div
                  class="flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border border-border bg-surface-muted flex items-center justify-center"
                >
                  <img
                    v-if="form.logoLight"
                    :src="form.logoLight"
                    :alt="$t('setup.step2Logo.logoSection.lightPreview')"
                    class="w-full h-full object-contain"
                  />
                  <span v-else class="text-xs text-muted">
                    {{ $t("setup.step2Logo.logoSection.preview") }}
                  </span>
                </div>
                <!-- 右侧输入和上传 -->
                <div class="flex-1 space-y-2">
                  <input
                    v-model="form.logoLight"
                    type="url"
                    class="block w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-surface text-foreground placeholder:text-muted"
                    :placeholder="
                      $t('setup.step2Logo.logoSection.lightPlaceholder')
                    "
                  />
                  <label
                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors text-xs font-medium cursor-pointer"
                  >
                    📷 {{ $t("setup.step2Logo.logoSection.upload") }}
                    <input
                      type="file"
                      class="hidden"
                      accept="image/*"
                      @change="(e) => handleLogoUpload(e, 'light')"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label
                class="block text-sm font-medium text-muted mb-2"
              >
                {{ $t("setup.step2Logo.logoSection.darkMode") }}
              </label>
              <div class="flex gap-3">
                <!-- 左侧预览区域 -->
                <div
                  class="flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border border-border bg-surface flex items-center justify-center"
                >
                  <img
                    v-if="form.logoDark"
                    :src="form.logoDark"
                    :alt="$t('setup.step2Logo.logoSection.darkPreview')"
                    class="w-full h-full object-contain"
                  />
                  <span v-else class="text-xs text-muted">
                    {{ $t("setup.step2Logo.logoSection.preview") }}
                  </span>
                </div>
                <!-- 右侧输入和上传 -->
                <div class="flex-1 space-y-2">
                  <input
                    v-model="form.logoDark"
                    type="url"
                    class="block w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-surface text-foreground placeholder:text-muted"
                    :placeholder="
                      $t('setup.step2Logo.logoSection.darkPlaceholder')
                    "
                  />
                  <label
                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors text-xs font-medium cursor-pointer"
                  >
                    📷 {{ $t("setup.step2Logo.logoSection.upload") }}
                    <input
                      type="file"
                      class="hidden"
                      accept="image/*"
                      @change="(e) => handleLogoUpload(e, 'dark')"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- 图标设置 -->
          <div
            class="space-y-4 pt-6 border-t border-border"
          >
            <h3 class="text-lg font-semibold text-foreground">
              {{ $t("setup.step2Logo.iconSection.title") }}
            </h3>

            <div>
              <label
                class="block text-sm font-medium text-muted mb-2"
              >
                {{ $t("setup.step2Logo.iconSection.lightMode") }}
              </label>
              <div class="flex gap-3">
                <!-- 左侧预览区域 -->
                <div
                  class="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border bg-surface-muted flex items-center justify-center"
                >
                  <img
                    v-if="form.iconLight"
                    :src="form.iconLight"
                    :alt="$t('setup.step2Logo.iconSection.lightPreview')"
                    class="w-full h-full object-contain"
                  />
                  <span v-else class="text-xs text-muted">
                    {{ $t("setup.step2Logo.iconSection.preview") }}
                  </span>
                </div>
                <!-- 右侧输入和上传 -->
                <div class="flex-1 space-y-2">
                  <input
                    v-model="form.iconLight"
                    type="url"
                    class="block w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-surface text-foreground placeholder:text-muted"
                    :placeholder="
                      $t('setup.step2Logo.iconSection.lightPlaceholder')
                    "
                  />
                  <label
                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors text-xs font-medium cursor-pointer"
                  >
                    📷 {{ $t("setup.step2Logo.iconSection.upload") }}
                    <input
                      type="file"
                      class="hidden"
                      accept="image/*"
                      @change="(e) => handleIconUpload(e, 'light')"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label
                class="block text-sm font-medium text-muted mb-2"
              >
                {{ $t("setup.step2Logo.iconSection.darkMode") }}
              </label>
              <div class="flex gap-3">
                <!-- 左侧预览区域 -->
                <div
                  class="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border bg-surface flex items-center justify-center"
                >
                  <img
                    v-if="form.iconDark"
                    :src="form.iconDark"
                    :alt="$t('setup.step2Logo.iconSection.darkPreview')"
                    class="w-full h-full object-contain"
                  />
                  <span v-else class="text-xs text-muted">
                    {{ $t("setup.step2Logo.iconSection.preview") }}
                  </span>
                </div>
                <!-- 右侧输入和上传 -->
                <div class="flex-1 space-y-2">
                  <input
                    v-model="form.iconDark"
                    type="url"
                    class="block w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-surface text-foreground placeholder:text-muted"
                    :placeholder="
                      $t('setup.step2Logo.iconSection.darkPlaceholder')
                    "
                  />
                  <label
                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-surface-muted transition-colors text-xs font-medium cursor-pointer"
                  >
                    📷 {{ $t("setup.step2Logo.iconSection.upload") }}
                    <input
                      type="file"
                      class="hidden"
                      accept="image/*"
                      @change="(e) => handleIconUpload(e, 'dark')"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 步骤 5: 管理员账号 -->
        <div v-if="currentStep === 4" class="space-y-6">
          <div class="text-center mb-8">
            <h2 class="text-2xl font-bold text-foreground mb-2">
              👤 {{ $t("setup.step3.title") }}
            </h2>
            <p class="text-muted">
              {{ $t("setup.step3.subtitle") }}
            </p>
          </div>

          <div class="space-y-4">
            <div>
              <label
                for="adminEmail"
                class="block text-sm font-medium text-muted mb-2"
              >
                {{ $t("setup.step3.email") }}
                <span class="text-red-500">*</span>
              </label>
              <input
                id="adminEmail"
                v-model="form.adminEmail"
                type="email"
                required
                :placeholder="$t('setup.step3.emailPlaceholder')"
                class="block w-full px-4 py-3 border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-surface text-foreground placeholder:text-muted"
              />
            </div>

            <div>
              <label
                for="adminUsername"
                class="block text-sm font-medium text-muted mb-2"
              >
                {{ $t("setup.step3.username") }}
                <span class="text-red-500">*</span>
              </label>
              <input
                id="adminUsername"
                v-model="form.adminUsername"
                type="text"
                required
                :placeholder="$t('setup.step3.usernamePlaceholder')"
                class="block w-full px-4 py-3 border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-surface text-foreground placeholder:text-muted"
              />
            </div>

            <div>
              <label
                for="adminName"
                class="block text-sm font-medium text-muted mb-2"
              >
                {{ $t("setup.step3.nickname") }}
              </label>
              <input
                id="adminName"
                v-model="form.adminName"
                type="text"
                :placeholder="$t('setup.step3.nicknamePlaceholder')"
                class="block w-full px-4 py-3 border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-surface text-foreground placeholder:text-muted"
              />
            </div>

            <div>
              <label
                for="adminPassword"
                class="block text-sm font-medium text-muted mb-2"
              >
                {{ $t("setup.step3.password") }}
                <span class="text-red-500">*</span>
              </label>
              <input
                id="adminPassword"
                v-model="form.adminPassword"
                type="password"
                required
                minlength="6"
                :placeholder="$t('setup.step3.passwordPlaceholder')"
                class="block w-full px-4 py-3 border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-surface text-foreground placeholder:text-muted"
              />
            </div>

            <div>
              <label
                for="adminPasswordConfirm"
                class="block text-sm font-medium text-muted mb-2"
              >
                {{ $t("setup.step3.passwordConfirm") }}
                <span class="text-red-500">*</span>
              </label>
              <input
                id="adminPasswordConfirm"
                v-model="form.adminPasswordConfirm"
                type="password"
                required
                minlength="6"
                :placeholder="$t('setup.step3.passwordConfirmPlaceholder')"
                class="block w-full px-4 py-3 border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-surface text-foreground placeholder:text-muted"
              />
            </div>
          </div>
        </div>

        <!-- 步骤 6: 确认 -->
        <div v-if="currentStep === 5" class="space-y-6">
          <div class="text-center mb-8">
            <h2 class="text-2xl font-bold text-foreground mb-2">
              ✅ {{ $t("setup.step4.title") }}
            </h2>
            <p class="text-muted">
              {{ $t("setup.step4.subtitle") }}
            </p>
          </div>

          <div class="space-y-4">
            <div class="bg-surface-muted rounded-lg p-4 border border-border">
              <h3 class="font-semibold text-foreground mb-3">
                {{ $t("setup.step4.siteInfo") }}
              </h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted"
                    >{{ $t("setup.step4.defaultLanguage") }}：</span
                  >
                  <span class="text-foreground font-medium">
                    {{
                      $t(`setup.languages.${String(form.defaultLang || "zh")}`)
                    }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted"
                    >{{ $t("setup.step4.enabledLanguages") }}：</span
                  >
                  <span class="text-foreground font-medium">
                    {{ form.enabledLanguages.map((c: string) => $t(`setup.languages.${c}`)).join("、") }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted"
                    >{{ $t("setup.step4.siteTitle") }}：</span
                  >
                  <span class="text-foreground font-medium">{{
                    form.siteTitle
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted"
                    >{{ $t("setup.step4.siteDescription") }}：</span
                  >
                  <span class="text-foreground font-medium">{{
                    form.siteDescription
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted"
                    >{{ $t("setup.step4.siteDomain") }}：</span
                  >
                  <span class="text-foreground font-medium">{{
                    form.siteDomain || $t("setup.step4.notSet")
                  }}</span>
                </div>
              </div>
            </div>

            <div class="bg-surface-muted rounded-lg p-4 border border-border">
              <h3 class="font-semibold text-foreground mb-3">
                ☁️ {{ $t("setup.step4.r2Config") }}
              </h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted"
                    >{{ $t("setup.step4.r2Url") }}：</span
                  >
                  <span class="text-foreground font-medium">{{
                    form.r2Url || $t("setup.step4.notSet")
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted"
                    >{{ $t("setup.step4.r2Bucket") }}：</span
                  >
                  <span class="text-foreground font-medium">{{
                    form.r2Bucket || $t("setup.step4.notSet")
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted"
                    >{{ $t("setup.step4.r2SecretId") }}：</span
                  >
                  <span class="text-foreground font-medium">{{
                    form.r2SecretId
                      ? form.r2SecretId.substring(0, 8) + "••••••••"
                      : $t("setup.step4.notSet")
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted"
                    >{{ $t("setup.step4.r2Domain") }}：</span
                  >
                  <span class="text-foreground font-medium">{{
                    form.r2Domain || $t("setup.step4.notSet")
                  }}</span>
                </div>
              </div>
            </div>

            <div class="bg-surface-muted rounded-lg p-4 border border-border">
              <h3 class="font-semibold text-foreground mb-3">
                🎨 {{ $t("setup.step4.logoAndIcons") }}
              </h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr>
                      <td
                        class="py-2 text-muted font-medium text-center"
                      >
                        {{ $t("setup.step4.logoLight") }}
                      </td>
                      <td
                        class="py-2 pr-4 text-muted font-medium text-center"
                      >
                        {{ $t("setup.step4.logoDark") }}
                      </td>
                      <td
                        class="py-2 text-muted font-medium text-center"
                      >
                        {{ $t("setup.step4.iconLight") }}
                      </td>
                      <td
                        class="py-2 text-muted font-medium text-center"
                      >
                        {{ $t("setup.step4.iconDark") }}
                      </td>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border">
                    <!-- 亮色模式 Logo -->
                    <tr>
                      <td>
                        <div class="flex items-center justify-center">
                          <img
                            v-if="form.logoLight"
                            :src="form.logoLight"
                            :alt="$t('setup.step4.logoLight')"
                            class="max-h-16 max-w-48 object-contain"
                          />
                          <span v-else class="text-muted">
                            {{ $t("setup.step4.notSet") }}
                          </span>
                        </div>
                      </td>
                      <!-- 暗色模式 Logo -->
                      <td>
                        <div class="flex items-center justify-center">
                          <img
                            v-if="form.logoDark"
                            :src="form.logoDark"
                            :alt="$t('setup.step4.logoDark')"
                            class="max-h-16 max-w-48 object-contain"
                          />
                          <span v-else class="text-muted">
                            {{ $t("setup.step4.notSet") }}
                          </span>
                        </div>
                      </td>
                      <!-- 亮色模式图标 -->
                      <td>
                        <div class="flex items-center justify-center">
                          <img
                            v-if="form.iconLight"
                            :src="form.iconLight"
                            :alt="$t('setup.step4.iconLight')"
                            class="max-h-16 max-w-16 object-contain"
                          />
                          <span v-else class="text-muted">
                            {{ $t("setup.step4.notSet") }}
                          </span>
                        </div>
                      </td>
                      <!-- 暗色模式图标 -->
                      <td>
                        <div class="flex items-center justify-center">
                          <img
                            v-if="form.iconDark"
                            :src="form.iconDark"
                            :alt="$t('setup.step4.iconDark')"
                            class="max-h-16 max-w-16 object-contain"
                          />
                          <span v-else class="text-muted">
                            {{ $t("setup.step4.notSet") }}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="bg-surface-muted rounded-lg p-4 border border-border">
              <h3 class="font-semibold text-foreground mb-3">
                {{ $t("setup.step4.adminInfo") }}
              </h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-muted"
                    >{{ $t("setup.step4.email") }}：</span
                  >
                  <span class="text-foreground font-medium">{{
                    form.adminEmail
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted"
                    >{{ $t("setup.step4.username") }}：</span
                  >
                  <span class="text-foreground font-medium">{{
                    form.adminUsername
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted"
                    >{{ $t("setup.step4.nickname") }}：</span
                  >
                  <span class="text-foreground font-medium">{{
                    form.adminName || form.adminUsername
                  }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted"
                    >{{ $t("setup.step4.password") }}：</span
                  >
                  <span class="text-foreground font-medium"
                    >••••••</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 按钮组 -->
        <div class="flex justify-between mt-8">
          <button
            v-if="currentStep > 0"
            @click="prevStep"
            type="button"
            class="px-6 py-3 border border-border rounded-lg text-foreground hover:bg-surface-muted font-medium transition-colors"
          >
            ← {{ $t("setup.buttons.prev") }}
          </button>
          <div v-else></div>

          <button
            v-if="currentStep < steps.length - 1"
            @click="nextStep"
            type="button"
            :disabled="!canGoNext"
            class="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ $t("setup.buttons.next") }} →
          </button>
          <button
            v-else
            @click="handleSubmit"
            type="button"
            :disabled="loading"
            class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span v-if="loading">
              <svg
                class="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </span>
            <span>{{
              loading
                ? $t("setup.buttons.submitting")
                : "🚀 " + $t("setup.buttons.submit")
            }}</span>
          </button>
        </div>
      </div>

      <!-- 提示信息 -->
      <div class="mt-6 text-center text-sm text-muted">
        <p>{{ $t("setup.footer.hint") }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EyeIcon, EyeSlashIcon } from "@heroicons/vue/24/outline";

definePageMeta({
  layout: false,
  requiresAuth: false, // 公开页面，系统初始化时使用
});

const { t: $t, locale } = useI18n();
const localePath = useLocalePath();
const switchLocalePath = useSwitchLocalePath();
const currentStep = ref(0);

const steps = [
  { key: "welcome" },
  { key: "site" },
  { key: "r2" },
  { key: "logo" },
  { key: "admin" },
  { key: "confirm" },
];

const languages = [
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
];

const form = ref({
  siteTitle: "",
  siteDescription: "",
  siteKeyword: "",
  siteDomain: "",
  r2Url: "",
  r2SecretId: "",
  r2SecretKey: "",
  r2Token: "",
  r2Bucket: "",
  r2Domain: "",
  logoLight: "",
  logoDark: "",
  iconLight: "",
  iconDark: "",
  defaultLang: "zh",
  enabledLanguages: ["zh"] as string[],
  adminEmail: "",
  adminUsername: "",
  adminName: "",
  adminPassword: "",
  adminPasswordConfirm: "",
});
form.value.defaultLang = locale.value;
if (!form.value.enabledLanguages.includes(form.value.defaultLang)) {
  form.value.enabledLanguages = [form.value.defaultLang];
}

// 自动填入当前域名（仅客户端）
if (import.meta.client && typeof window !== "undefined" && window.location?.host && !form.value.siteDomain) {
  form.value.siteDomain = window.location.host;
}

const loading = ref(false);
const errorMessage = ref("");
// R2 配置字段显示/隐藏状态
const showR2SecretKey = ref(false);
const showR2SecretId = ref(false);
const showR2Token = ref(false);

// 选择主语言并切换国际化（同时切换 URL 前缀）
const selectLanguage = async (langCode: string) => {
  form.value.defaultLang = langCode;
  ensureDefaultInEnabled();
  const path = switchLocalePath(langCode as "zh" | "en" | "ja" | "de" | "es");
  navigateTo(path);
};

const ensureDefaultInEnabled = () => {
  const code = form.value.defaultLang;
  if (!form.value.enabledLanguages.includes(code)) {
    form.value.enabledLanguages = [...form.value.enabledLanguages, code];
  }
};

const toggleEnabledLanguage = (code: string) => {
  const list = form.value.enabledLanguages;
  if (list.includes(code)) {
    if (list.length <= 1) return;
    form.value.enabledLanguages = list.filter((c) => c !== code);
  } else {
    form.value.enabledLanguages = [...list, code].sort();
  }
};

// 验证当前步骤是否可以进入下一步
const canGoNext = computed(() => {
  switch (currentStep.value) {
    case 0: // 欢迎页
      return form.value.defaultLang !== "" && form.value.enabledLanguages.length > 0;
    case 1: // 网站信息
      return (
        form.value.siteTitle.trim() !== "" &&
        form.value.siteDescription.trim() !== ""
      );
    case 2: // R2 配置
      return (
        form.value.r2Url.trim() !== "" &&
        form.value.r2SecretId.trim() !== "" &&
        form.value.r2SecretKey.trim() !== "" &&
        form.value.r2Bucket.trim() !== "" &&
        form.value.r2SecretId.trim().length === 32
      );
    case 3: // Logo和图标设置（可选，可以直接跳过）
      return true;
    case 4: // 管理员
      return (
        form.value.adminEmail.trim() !== "" &&
        form.value.adminUsername.trim() !== "" &&
        form.value.adminPassword.length >= 6 &&
        form.value.adminPasswordConfirm.length >= 6
      );
    default:
      return true;
  }
});

const nextStep = async () => {
  errorMessage.value = "";

  // 步骤 2 的特殊验证和保存（R2 配置）
  if (currentStep.value === 2) {
    if (form.value.r2SecretId.trim().length !== 32) {
      errorMessage.value = $t("setup.errors.r2SecretIdInvalid");
      return;
    }

    // 保存 R2 配置到数据库（服务端会同时更新配置缓存，后续步骤/请求会使用最新配置）
    try {
      const response: any = await $fetch("/api/system/r2-config", {
        method: "POST",
        body: {
          r2Url: form.value.r2Url,
          r2SecretId: form.value.r2SecretId,
          r2SecretKey: form.value.r2SecretKey,
          r2Token: form.value.r2Token,
          r2Bucket: form.value.r2Bucket,
          r2Domain: form.value.r2Domain,
        },
      });

      if (response?.c !== 200) {
        errorMessage.value = response?.m || $t("setup.errors.r2ConfigSaveFailed");
        return;
      }
    } catch (err: any) {
      errorMessage.value = err?.message || $t("setup.errors.r2ConfigSaveFailed");
      return;
    }
  }

  // 步骤 4 的特殊验证（密码一致性）
  if (currentStep.value === 4) {
    const password = String(form.value.adminPassword || "");
    const passwordConfirm = String(form.value.adminPasswordConfirm || "");
    if (password !== passwordConfirm) {
      errorMessage.value = $t("setup.errors.passwordMismatch");
      return;
    }
  }

  if (currentStep.value < steps.length - 1) {
    currentStep.value++;
  }
};

const prevStep = () => {
  errorMessage.value = "";
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

// 上传Logo
const handleLogoUpload = async (event: Event, mode: "light" | "dark") => {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) {
    return;
  }

  const file = target.files[0];
  if (!file) {
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", `logo-${mode}`);

  try {
    const response: any = await $fetch("/api/system/logo", {
      method: "POST",
      body: formData,
    });

    if (response?.c === 200) {
      if (mode === "light") {
        form.value.logoLight = response.d.url;
        errorMessage.value = ""; // 清除错误信息
      } else {
        form.value.logoDark = response.d.url;
        errorMessage.value = ""; // 清除错误信息
      }
    } else {
      errorMessage.value = response?.m || $t("setup.errors.logoUploadFailed");
    }
  } catch (err: any) {
    errorMessage.value = err?.message || $t("setup.errors.logoUploadFailed");
  } finally {
    target.value = "";
  }
};

// 上传图标
const handleIconUpload = async (event: Event, mode: "light" | "dark") => {
  const target = event.target as HTMLInputElement;
  if (!target.files?.length) {
    return;
  }

  const file = target.files[0];
  if (!file) {
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", `icon-${mode}`);

  try {
    const response: any = await $fetch("/api/system/logo", {
      method: "POST",
      body: formData,
    });

    if (response?.c === 200) {
      if (mode === "light") {
        form.value.iconLight = response.d.url;
        errorMessage.value = ""; // 清除错误信息
      } else {
        form.value.iconDark = response.d.url;
        errorMessage.value = ""; // 清除错误信息
      }
    } else {
      errorMessage.value = response?.m || $t("setup.errors.iconUploadFailed");
    }
  } catch (err: any) {
    errorMessage.value = err?.message || $t("setup.errors.iconUploadFailed");
  } finally {
    target.value = "";
  }
};

const handleSubmit = async () => {
  errorMessage.value = "";

  // 验证密码
  if (form.value.adminPassword !== form.value.adminPasswordConfirm) {
    errorMessage.value = $t("setup.errors.passwordMismatch");
    return;
  }

  if (form.value.adminPassword.length < 6) {
    errorMessage.value = $t("setup.errors.passwordTooShort");
    return;
  }

  loading.value = true;

  try {
    const response = await $fetch("/api/system/init", {
      method: "POST",
      body: {
        adminEmail: form.value.adminEmail,
        adminUsername: form.value.adminUsername,
        adminName: form.value.adminName || form.value.adminUsername, // 如果未填写昵称，使用用户名
        adminPassword: form.value.adminPassword,
        siteTitle: form.value.siteTitle,
        siteDescription: form.value.siteDescription,
        siteKeyword: form.value.siteKeyword,
        siteDomain: form.value.siteDomain || undefined,
        r2Url: form.value.r2Url || undefined,
        r2SecretId: form.value.r2SecretId || undefined,
        r2SecretKey: form.value.r2SecretKey || undefined,
        r2Token: form.value.r2Token || undefined,
        r2Bucket: form.value.r2Bucket || undefined,
        r2Domain: form.value.r2Domain || undefined,
        logoLight: form.value.logoLight || undefined,
        logoDark: form.value.logoDark || undefined,
        iconLight: form.value.iconLight || undefined,
        iconDark: form.value.iconDark || undefined,
        defaultLang: form.value.defaultLang,
        enabledLanguages: form.value.enabledLanguages,
      },
    });

    if ((response as any).c === 200) {
      // 清除初始化检查缓存
      if (process.client) {
        sessionStorage.setItem("init-checked", "true");
      }
      // 初始化成功，跳转到登录页
      await navigateTo(`${localePath("/login")}?initialized=true`);
    } else {
      errorMessage.value = (response as any).m || $t("setup.errors.initFailed");
    }
  } catch (err: any) {
    errorMessage.value =
      err.data?.m || err.message || $t("setup.errors.initFailedRetry");
  } finally {
    loading.value = false;
  }
};
</script>
