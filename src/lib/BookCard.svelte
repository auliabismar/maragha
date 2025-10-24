<script>
  import { Card, Badge } from 'flowbite-svelte';

  // This component receives a single 'book' object as a prop.
  // 'book' should include 'judul', 'status', and 'coverUrl'.
  let { book } = $props();

  // Helper to determine badge color based on status
  function getStatusColor(status) {
    switch (status) {
      case 'Published':
        return 'green';
      case 'Draft':
        return 'yellow';
      case 'Archived':
        return 'dark';
      case 'Terbit': // Added based on your filter requirement
        return 'green';
      default:
        return 'gray';
    }
  }

  // Event handler for the image error
  function handleImageError(event) {
    event.target.src =
      'https://placehold.co/400x600/374151/9CA3AF?text=No+Image';
  }
</script>

<Card padding="none">
  <a href={`/buku/${book.id}`}>
    <img
      class="rounded-t-lg w-full h-64 object-cover"
      src={book.coverUrl}
      alt="Cover for {book.judul}"
      onerror={handleImageError}
    />
  </a>
  <div class="p-5">
    <div class="flex justify-between items-start mb-2">
      <h5
        class="text-xl font-bold tracking-tight text-gray-900 dark:text-white line-clamp-2"
      >
        <a href={`/buku/${book.id}`}>
          {book.judul}
        </a>
      </h5>
      <Badge color={getStatusColor(book.status)} class="flex-shrink-0 ml-2">
        {book.status}
      </Badge>
    </div>
    <!-- 
      You could display other info here, like author or publisher.
      This would require 'expand' in your PocketBase query.
      e.g., <p class="text-sm text-gray-500">{book.expand?.penerbit?.nama || 'Unknown Publisher'}</p> 
    -->
  </div>
</Card>
