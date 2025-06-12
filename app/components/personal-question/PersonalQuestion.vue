<script lang="ts" setup>
import { object, string, boolean } from 'yup'
import { useForm, useField } from 'vee-validate'
import { storeToRefs } from 'pinia'

const userStore = useUserStore()
const questionStore = useQuestionStore()
const { loading } = storeToRefs(questionStore)

const [isOpen, open] = useToggle()

const validationSchema = object({
  question: string()
    .required('Question is required')
    .min(10, 'Question must be at least 10 characters')
    .max(1000, 'Question must be less than 1000 characters'),
})

const { handleSubmit, resetForm } = useForm({
  validationSchema,
  initialValues: {
    question: '',
  },
})

const { value: question, errorMessage: questionError } = useField('question')

const snackbar = useSnackbar()

const submitQuestion = handleSubmit(async values => {
  try {
    await questionStore.createQuestion({
      userId: userStore.id,
      question: values.question,
    })

    snackbar.add({
      type: 'success',
      text: 'Your question has been submitted',
    })

    isOpen.value = false
    resetForm()
  } catch (error) {
    snackbar.add({
      type: 'success',
      text: 'Failed to submit question. Please try again.',
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
    :disabled="loading">
    <span class="mdi mdi-alert mr-2"></span>
    PERSONAL QUESTION
    <span v-if="loading" class="ml-2">
      <svg
        class="animate-spin h-5 w-5 text-[#b5e103]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </span>
  </button>

  <CustomModal :is-open="isOpen" @close="closeModal" title="PERSONAL QUESTION">
    <div class="mt-4">
      <form @submit.prevent="submitQuestion">
        <div class="mb-4">
          <textarea
            v-model="question"
            name="question"
            class="w-full bg-black border border-[#b5e103] rounded-lg p-3 text-[#b5e103] focus:border-[#fe39fa] focus:ring-1 focus:ring-[#fe39fa]"
            placeholder="Enter your question..."
            rows="5"
            :disabled="loading"></textarea>
          <div v-if="questionError" class="text-[#fe39fa] text-xs mt-1">
            {{ questionError }}
          </div>
        </div>

        <div class="flex justify-end space-x-3">
          <button
            type="button"
            @click="closeModal"
            class="bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg border border-gray-700"
            :disabled="loading">
            CANCEL
          </button>
          <button
            type="submit"
            class="bg-[#b5e103]/10 hover:bg-[#b5e103]/20 text-[#b5e103] py-2 px-4 rounded-lg border border-[#b5e103] hover:border-[#fe39fa] flex items-center"
            :disabled="loading">
            <span v-if="loading" class="mr-2">
              <svg
                class="animate-spin h-4 w-4 text-[#b5e103]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
            SUBMIT
          </button>
        </div>
      </form>
    </div>
  </CustomModal>
</template>
