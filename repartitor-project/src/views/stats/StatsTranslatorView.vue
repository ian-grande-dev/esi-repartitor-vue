<script>
import PersonStats from '../../components/PersonStats.vue'

// Stats of one translator. The trigram is in the URL: /stats/translator/:id
export default {
  components: { PersonStats },
}
</script>

<template>
  <!-- :key = rebuild the page when the id in the URL changes -->
  <PersonStats kind="translator" :person-id="$route.params.id" :key="$route.params.id" />
</template>
