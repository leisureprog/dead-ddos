<script lang="ts" setup>
import { object, string } from 'yup'
import { useForm, useField } from 'vee-validate'
import { useUserStore } from '~/stores/user'
import { useReportStore } from '~/stores/report'

const [isOpen, open] = useToggle()
const userStore = useUserStore()
const reportStore = useReportStore()

// Схема валидации
const validationSchema = object({
  message: string()
    .required('Report message is required')
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters'),
})

// Инициализация формы
const { handleSubmit, resetForm, isSubmitting } = useForm({
  validationSchema,
  initialValues: {
    message: '',
  },
})

// Поле для сообщения
const { value: message, errorMessage } = useField('message')

async function getIpAddress(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip
  } catch {
    return 'unknown'
  }
}

const snackbar = useSnackbar()

// Обработка отправки формы
const submitReport = handleSubmit(async values => {
  try {
    const ipAddress = await getIpAddress()

    await reportStore.createReport({
      message: values.message,
      userId: userStore.id,
      ipAddress
    })

    isOpen.value = false
    resetForm()
  
    snackbar.add({
      type: 'success',
      text: 'Report submitted successfully!',
    })
  } catch (error) {
    snackbar.add({
      type: 'success',
      text: 'Failed to submit report. Please try again.',
    })
  }
})

const closeModal = () => {
  isOpen.value = false
  resetForm()
}

</script>

<template>
  <button
    @click="open()"
    class="bg-gray-900 hover:bg-[#b5e103]/10 text-[#b5e103] py-3 px-4 rounded-lg border border-[#b5e103] transition-all flex items-center justify-center hover:border-[#fe39fa]"
    :disabled="isSubmitting">
    <span class="mdi mdi-alert mr-2"></span>
    MAKE REPORT
  </button>

  <CustomModal :is-open="isOpen" @close="closeModal" title="MAKE REPORT">
    <div class="mt-4">
      <form @submit.prevent="submitReport">
        <textarea
          v-model="message"
          name="message"
          class="w-full bg-black border border-[#b5e103] rounded-lg p-3 text-[#b5e103] mb-1 h-32 focus:border-[#fe39fa] focus:ring-1 focus:ring-[#fe39fa]"
          placeholder="Describe your issue in detail..."
          :disabled="isSubmitting"></textarea>

        <div v-if="errorMessage" class="text-[#fe39fa] text-xs mb-3">
          {{ errorMessage }}
        </div>

        <div class="flex justify-end space-x-3">
          <button
            type="button"
            @click="closeModal"
            class="bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg border border-gray-700"
            :disabled="isSubmitting">
            CANCEL
          </button>
          <button
            type="submit"
            class="bg-[#b5e103]/10 hover:bg-[#b5e103]/20 text-[#b5e103] py-2 px-4 rounded-lg border border-[#b5e103] hover:border-[#fe39fa] flex items-center"
            :disabled="isSubmitting">
            <span v-if="isSubmitting" class="mdi mdi-loading mdi-spin mr-2"></span>
            {{ isSubmitting ? 'SUBMITTING...' : 'SUBMIT' }}
          </button>
        </div>
      </form>
    </div>
  </CustomModal>
</template>
