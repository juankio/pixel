<script setup lang="ts">
import type { VectorSelectionChangePayload } from '~/types'
import { useProcessing } from '~/composables/useProcessing'
import { useImageUpload } from '~/composables/useImageUpload'
import { useSvgEditor } from '~/composables/useSvgEditor'
import { useElementSelection } from '~/composables/useElementSelection'
import { useColorChange } from '~/composables/useColorChange'
import { useHealthCheck } from '~/composables/useHealthCheck'
import { useVectorActions } from '~/composables/useVectorActions'
import { useDownload } from '~/composables/useDownload'

const { processing, processingText, errorMessage, withLoader } = useProcessing()
const { selectedFile, originalPreviewUrl, hasFile, fileName, setFile, clearFile, revokePreviewUrl } = useImageUpload()
const { svgResult, svgHistory, autoFitEnabled, hasSvg, pushHistory, undo, autoFit, setVectorSvg, clearSvg } = useSvgEditor()
const { selectedElementIds, selectedElementColor, activeSelectedElementId, selectedElementCount, resetSelection, onSelectionChange } = useElementSelection()
const { applyColorChange, applySelectedElementColor } = useColorChange(svgResult, pushHistory, resetSelection)
const { healthStatus, healthText, metrics, refreshHealth, refreshMetrics } = useHealthCheck()
const { runBasicVectorize, runAdvancedVectorize, runUpscaleVectorize, removeSelectedElements } = useVectorActions(
  selectedFile, svgResult, svgHistory, autoFitEnabled, withLoader, setVectorSvg, autoFit, pushHistory, resetSelection, refreshMetrics
)
const { downloadSvg, downloadPng } = useDownload(svgResult, withLoader)

const onFileSelected = (file: File) => {
  setFile(file)
  clearSvg()
  resetSelection()
  errorMessage.value = ''
}

const onClearFile = () => {
  clearFile()
  clearSvg()
  resetSelection()
  errorMessage.value = ''
}

const onVectorSelectionChange = (payload: VectorSelectionChangePayload) => {
  onSelectionChange(payload)
}

const onApplySelectedColor = (color: string) => {
  const next = applySelectedElementColor(color, selectedElementIds.value)
  if (next) selectedElementColor.value = next
}

const onRemoveSelected = () => removeSelectedElements(selectedElementIds.value)

onMounted(() => Promise.allSettled([refreshHealth(), refreshMetrics()]))
onBeforeUnmount(() => revokePreviewUrl())
</script>

<template>
  <div class="min-h-screen bg-[radial-gradient(ellipse_at_top,_#e0f7fa_0%,_#f8fafc_40%,_#f8fafc_100%)]">
    <div class="mx-auto w-full max-w-[1440px] space-y-6 px-4 py-6 md:px-8 md:py-8">

      <AppHeader :health-status="healthStatus" :health-text="healthText" />

      <UAlert
        v-if="errorMessage"
        color="error"
        variant="soft"
        icon="i-lucide-alert-circle"
        :description="errorMessage"
      />

      <main class="grid gap-6 xl:grid-cols-[380px_1fr]">
        <aside class="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <ImageUploader
            :disabled="processing"
            :file-name="fileName"
            @file-selected="onFileSelected"
            @clear="onClearFile"
          />
          <ControlsPanel
            :processing="processing"
            :has-file="hasFile"
            :has-svg="hasSvg"
            :health-status="healthStatus"
            :health-text="healthText"
            :metrics="metrics"
            @vectorize-basic="runBasicVectorize"
            @vectorize-advanced="runAdvancedVectorize"
            @upscale="runUpscaleVectorize"
            @download-svg="downloadSvg"
            @download-png="downloadPng"
            @refresh-health="refreshHealth"
            @refresh-metrics="refreshMetrics"
          />
        </aside>

        <section class="space-y-4">
          <div class="grid gap-4 lg:grid-cols-2">
            <PreviewImage :src="originalPreviewUrl" />
            <VectorPreview
              :svg="svgResult"
              :interactive="hasSvg"
              :selected-element-ids="selectedElementIds"
              @selection-change="onVectorSelectionChange"
            />
          </div>

          <EditorToolbar
            v-model:auto-fit-enabled="autoFitEnabled"
            :processing="processing"
            :selected-element-count="selectedElementCount"
            :has-history="svgHistory.length > 0"
            :has-svg="hasSvg"
            @remove-selected="onRemoveSelected"
            @reset-selection="resetSelection"
            @undo="undo"
            @auto-fit="autoFit(true)"
          />

          <ColorEditor
            :svg="svgResult"
            :disabled="processing || !hasSvg"
            :selected-element-id="activeSelectedElementId"
            :selected-element-color="selectedElementColor"
            @color-change="applyColorChange"
            @selected-color-change="onApplySelectedColor"
          />
        </section>
      </main>
    </div>

    <Loader :show="processing" :text="processingText" />
  </div>
</template>
