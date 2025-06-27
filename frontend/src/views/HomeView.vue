<script setup lang="ts">
import { ref, onMounted } from 'vue';

const message = ref<string>('Chargement...');

onMounted(async () => {
  try {
    const res = await fetch('http://localhost:3001/');
    const data = await res.json();
    message.value = data.message;
  } catch (error) {
    console.error('Erreur:', error);
    message.value = 'Erreur lors de la récupération du message';
  }
});
</script>

<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4 text-green-600">TSNESS API Frontend</h1>
    <p class="text-lg bg-white p-4 rounded shadow">{{ message }}</p>
  </div>
</template>

<style scoped>
body {
  background-color: #f5f5f5;
  font-family: Arial, sans-serif;
}
</style>
