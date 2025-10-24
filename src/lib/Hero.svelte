<script lang="ts">
  import { Section, HeroHeader } from "flowbite-svelte-blocks";
  import { Button } from "flowbite-svelte";
  import { ArrowRightOutline } from "flowbite-svelte-icons";
</script>

<div class="relative w-full mx-auto bg-secondary-50 dark:bg-secondary-900">
  <Section name="heroVisual" class="relative">
    <div class="absolute inset-0 lg:left-2/3 opacity-20 lg:opacity-100">
      <img class="w-full h-full object-cover" src="/images/hero.png" alt="mockup" />
    </div>
    <div class="relative z-10 mr-auto place-self-center lg:col-span-7">
      <HeroHeader h1Class="max-w-3xl mb-4 text-4xl leading-14 font-thin tracking-normal md:text-5xl xl:text-6xl dark:text-white" pClass="text-left max-w-3xl mb-6 font-light leading-7 text-gray-500 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400 sm:px-0 lg:px-0 xl:px-0">
        {#snippet h1()}Bantu Wujudkan Akses Gratis ke Buku Klasik Arab yang Diterjemahkan{/snippet}
        {#snippet paragraph()}Proyek ini menyediakan platform web gratis bagi penerjemah untuk menerjemahkan buku klasik Arab dan bagi pembaca untuk menikmati terjemahan tersebut. Dengan donasi Anda, kami dapat memperluas koleksi, meningkatkan fitur, dan memastikan pengetahuan berharga ini tersedia bagi semua orang tanpa biaya.{/snippet}
        <a href="/"><Button size="xl" color="primary" class="mr-3 inline-flex items-center justify-center">Donasi Sekarang<ArrowRightOutline size="md" class="-mr-1 ml-2" /></Button></a>
        <a href="/"><Button color="secondary" size="xl" class="inline-flex items-center justify-center">Akses Buku Gratis</Button></a>
      </HeroHeader>
    </div>
  </Section>
</div>