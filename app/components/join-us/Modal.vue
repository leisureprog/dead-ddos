<script lang="ts" setup>
import { useForm, Field } from 'vee-validate'
import * as yup from 'yup'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  profile: any | null
}>()

const emit = defineEmits(['close'])

const userStore = useUserStore()

const snackbar = useSnackbar()

// Схема валидации
const validationSchema = yup.object({
  nickname: yup
    .string()
    .min(3, 'Nickname must be at least 3 characters')
    .max(20, 'Nickname must be at most 20 characters')
    .required('Nickname is required'),
  age: yup
    .number()
    .min(13, 'You must be at least 13')
    .max(99, 'Age must be at most 99')
    .required('Age is required')
    .typeError('Age must be a number'),
  telegram: yup
    .string()
    .matches(/^[a-zA-Z0-9_]{5,32}$/, 'Invalid Telegram username')
    .required('Telegram is required'),
  skills: yup.string().min(10, 'Describe at least 2 skills').required('Skills are required'),
})

const { handleSubmit, errors, resetForm, isSubmitting } = useForm({
  validationSchema,
  initialValues: {
    nickname: props.profile?.nickname || '',
    age: props.profile?.age || null,
    telegram: props.profile?.telegram || userStore?.username || '',
    skills: props.profile?.skills || '',
  },
})

const onSubmit = handleSubmit(async values => {
  try {
    await userStore.updateUserProfile({
      nickname: values.nickname,
      age: Number(values.age),
      telegram: values.telegram,
      skills: values.skills,
    })

    if (!userStore.profile?.lastEdited) {
      snackbar.add({
        type: 'success',
        text: 'Profile submitted for approval!',
      })
    } else {
      snackbar.add({
        type: 'success',
        text: 'Profile updated!',
      })
    }

    emit('close')
  } catch (error) {
    snackbar.add({
      type: 'error',
      text: 'Failed to save profile',
    })
    console.error('Profile submission error:', error)
  }
})
</script>

<template>
  <form @submit="onSubmit" class="mt-4 space-y-4">
    <div>
      <label class="block text-[#b5e103] text-sm mb-1">NICKNAME</label>
      <Field
        name="nickname"
        type="text"
        class="w-full bg-black border border-[#b5e103] rounded-lg p-3 text-[#b5e103] focus:border-[#fe39fa] focus:ring-1 focus:ring-[#fe39fa]"
        placeholder="Your hacker nickname"
        :disabled="isSubmitting" />
      <span class="text-[#fe39fa] text-xs">{{ errors.nickname }}</span>
    </div>

    <div>
      <label class="block text-[#b5e103] text-sm mb-1">AGE</label>
      <Field
        name="age"
        type="number"
        class="w-full bg-black border border-[#b5e103] rounded-lg p-3 text-[#b5e103] focus:border-[#fe39fa] focus:ring-1 focus:ring-[#fe39fa]"
        placeholder="Your age"
        :disabled="isSubmitting" />
      <span class="text-[#fe39fa] text-xs">{{ errors.age }}</span>
    </div>

    <div>
      <label class="block text-[#b5e103] text-sm mb-1">TELEGRAM USERNAME</label>
      <div class="flex">
        <span
          class="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-[#b5e103] bg-gray-800 text-gray-400"
          >@</span
        >
        <Field
          name="telegram"
          type="text"
          class="w-full bg-black border border-[#b5e103] rounded-r-lg p-3 text-[#b5e103] focus:border-[#fe39fa] focus:ring-1 focus:ring-[#fe39fa]"
          placeholder="username"
          :disabled="isSubmitting" />
      </div>
      <span class="text-[#fe39fa] text-xs">{{ errors.telegram }}</span>
    </div>

    <div>
      <label class="block text-[#b5e103] text-sm mb-1">SKILLS</label>
      <Field
        name="skills"
        as="textarea"
        class="w-full bg-black border border-[#b5e103] rounded-lg p-3 text-[#b5e103] h-20 focus:border-[#fe39fa] focus:ring-1 focus:ring-[#fe39fa]"
        placeholder="Your hacking skills (separate by commas)"
        :disabled="isSubmitting" />
      <span class="text-[#fe39fa] text-xs">{{ errors.skills }}</span>
    </div>

    <div v-if="userStore.profile?.lastEdited" class="text-[#b5e103] text-xs">
      Last edited: {{ new Date(profile?.lastEdited).toLocaleString() }}
      <span v-if="profile?.isApproved" class="text-green-500"> • APPROVED</span>
      <span v-else class="text-yellow-500"> • PENDING APPROVAL</span>
    </div>

    <div class="flex justify-end space-x-3 pt-2">
      <button
        type="button"
        @click="emit('close')"
        class="bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg border border-gray-700"
        :disabled="isSubmitting">
        CANCEL
      </button>
      <button
        type="submit"
        class="bg-[#b5e103]/10 hover:bg-[#b5e103]/20 text-[#b5e103] py-2 px-4 rounded-lg border border-[#b5e103] hover:border-[#fe39fa] flex items-center"
        :disabled="isSubmitting">
        <span v-if="isSubmitting" class="mdi mdi-loading mdi-spin mr-2"></span>
        {{ isSubmitting ? 'PROCESSING...' : 'SUBMIT' }}
      </button>
    </div>
  </form>
</template>
