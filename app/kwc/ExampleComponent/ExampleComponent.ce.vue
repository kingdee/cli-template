<script setup lang="ts">
import { ref } from 'vue';

const inputValue = ref('');

const handleLog = () => {
  console.log('Input Value: ', inputValue.value);
};
</script>

<template>
  <div class="simple-demo">
    <input
      v-model="inputValue"
      type="text"
      placeholder="Type something..."
      class="demo-input"
    >
    <button class="demo-btn" @click="handleLog">
      Log to Console
    </button>
  </div>
</template>

<style lang="scss" scoped>
.simple-demo {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 300px;

  .demo-input {
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .demo-btn {
    padding: 8px 16px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      background-color: #0056b3;
    }
  }
}
</style>
