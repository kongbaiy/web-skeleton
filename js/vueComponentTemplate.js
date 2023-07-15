var vueComponentTemplate = `<template>
<div :hidden="visible"><@content></div>
</template>
<script>
export default {
    props: {
        visible: {
            type: Boolean,
            default: false
        }
    }
}
</script>
<style scoped>
@keyframes <@keyframesName> {0% {opacity: 1}50%{opacity: .5}100% {opacity: 1}}
.<@className> {animation: <@keyframesName> 1s linear infinite;}
</style>
`;