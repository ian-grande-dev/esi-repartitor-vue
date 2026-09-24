<script>
import PersonStats from '../../components/PersonStats.vue'

// Stats of one editor. The trigram is in the URL: /stats/editor/:id
export default {
  components: { PersonStats },
}
</script>

<template>
  <!-- :key = rebuild the page when the id in the URL changes -->
  <PersonStats kind="editor" :person-id="$route.params.id" :key="$route.params.id" />
</template>
