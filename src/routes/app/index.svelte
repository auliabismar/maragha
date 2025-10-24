<script>
  import { pb } from '$lib/pocketbase';
  import BookFilter from '$lib/BookFilter.svelte';
  import BookCard from '$lib/BookCard.svelte';
  import { Spinner, Alert } from 'flowbite-svelte';
  import { InfoCircleOutline } from 'flowbite-svelte-icons';

  // Svelte 5 State Runes
  let books = $state([]);
  let isLoading = $state(true);
  let error = $state(null);
  let userFilter = $state(''); // Stores the filter string from the component

  // This function will be called by the BookFilter component
  function handleFilterApply(newFilter) {
    userFilter = newFilter;
  }

  // $effect runs when the component mounts and
  // re-runs whenever 'userFilter' changes.
  $effect(() => {
    async function fetchBooks() {
      isLoading = true;
      error = null;

      // 1. Define the static, required filter
      const staticFilter = `status="Terbit"`;
      let finalFilter = staticFilter;

      let titleFilter = '';
      let authorFilter = '';

      // Parse userFilter to separate title and author filters
      console.log('User Filter:', userFilter);
      if (userFilter) {
        finalFilter = `${staticFilter} && (${userFilter})`;
        /* const parts = userFilter.split(' && ');
        for (const part of parts) {
          if (part.includes('judul ~')) {
            titleFilter = part;
          } else if (part.includes('penulis.nama ~')) {
            authorFilter = part;
          }
        } */
      }

      /* let authorIds = [];
      if (authorFilter) {
        try {
          // 1. Query the 'penulis' collection to get matching author IDs
          const authorRecords = await pb.collection('penulis').getFullList({
            filter: authorFilter.replace('penulis.nama', 'nama'), // Adjust filter for 'penulis' collection
          });
          authorIds = authorRecords.map(author => `'${author.id}'`);
        } catch (err) {
          console.error('Failed to fetch authors:', err);
          // If author fetching fails, no books will be found for this filter
          isLoading = false;
          books = [];
          return;
        }
      }

      const dynamicFilters = [];
      if (titleFilter) {
        dynamicFilters.push(titleFilter);
      }

      if (authorIds.length > 0) {
        dynamicFilters.push(`penulis.id ?= [${authorIds.join(',')}]`);
      } else if (authorFilter) {
        // If an author filter was applied but no authors were found, return no books
        isLoading = false;
        books = [];
        return;
      }

      if (dynamicFilters.length > 0) {
        finalFilter = `${staticFilter} && (${dynamicFilters.join(' && ')})`;
      }
      if (userFilter){
        finalFilter = `${staticFilter} && (${userFilter})`;
      } */
      try {
        // 3. Fetch data using the combined filter
        pb.autoCancellation(false);
        const resultList = await pb.collection('buku').getList(1, 12, {
          filter: finalFilter,
          // Expand relations if you want to display them in the card
          // (e.g., author name)
          expand: 'penulis,penerbit,kategori'
        });

        // Process items to create the full cover URL
        const processedBooks = resultList.items.map((item) => {
          const coverUrl = item.cover
            ? pb.files.getURL(item, item.cover, { thumb: '400x600' })
            : 'https://placehold.co/400x600/374151/9CA3AF?text=No+Image';

          return {
            ...item,
            coverUrl: coverUrl
          };
        });

        books = processedBooks;
      } catch (err) {
        console.error('Failed to fetch books:', err);
        error = err.message || 'Could not load books.';
      } finally {
        isLoading = false;
      }
    }

    fetchBooks();
  }); // <-- The dependency array is removed
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-6">
    Katalog Buku
  </h1>

  <!-- 1. The Filter Component -->
  <div class="mb-8">
    <BookFilter onApply={handleFilterApply} />
  </div>

  <!-- 2. The Results Section (Loading, Error, or List) -->
  <div>
    {#if isLoading}
      <div class="flex justify-center items-center h-64">
        <Spinner size="8" />
        <span class="ml-4 text-lg text-gray-500 dark:text-gray-400"
          >Loading books...</span
        >
      </div>
    {:else if error}
      <Alert color="red" border>
        <InfoCircleOutline slot="icon" class="w-5 h-5" />
        <span class="font-medium">Error!</span> {error}
      </Alert>
    {:else if books.length === 0}
      <Alert color="blue" border>
        <InfoCircleOutline slot="icon" class="w-5 h-5" />
        <span class="font-medium">No results.</span>
        No books found with status 'Terbit' match your criteria.
      </Alert>
    {:else}
      <!-- 3. The Book Card Grid -->
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        {#each books as book (book.id)}
          <!-- The BookCard component you provided is used here -->
          <BookCard {book} />
        {/each}
      </div>
    {/if}
  </div>
</div>

