import { useRef, useEffect } from "react";
import { Trophy as TrophyIcon } from "lucide-react";
import { useCommunityFeed } from "@/hooks/use-community-feed";
import TrophyFeedCard from "@/components/TrophyFeedCard";

export default function CommunityFeed({
  feedMode = "global",
  feedSort = "newest",
  debouncedSearch = "",
}: {
  feedMode?: "global" | "following";
  feedSort?: string;
  debouncedSearch?: string;
}) {
  const {
    allFeedItems,
    allUserApplauds,
    followingSet,
    feedLoading,
    hasNextPage,
    isFetchingNextPage,
    currentUser,
    isAuthenticated,
    applaudMutation,
    unApplaudMutation,
    followMutation,
    unfollowMutation,
    fetchNextPage,
  } = useCommunityFeed(feedMode, feedSort, debouncedSearch);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (feedLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (allFeedItems.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <TrophyIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p className="font-serif text-lg">
          {feedMode === "following" ? "No trophies from users you follow" : "No trophies found"}
        </p>
        <p className="text-sm mt-1">
          {feedMode === "following"
            ? "Follow some hunters to see their trophies here"
            : debouncedSearch
              ? "Try a different search term"
              : "Be the first to share a trophy!"
          }
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {allFeedItems.map((item, i) => (
        <TrophyFeedCard
          key={`${item.trophy.id}-${i}`}
          item={item}
          isApplauded={allUserApplauds.has(item.trophy.id)}
          onApplaud={(id) => applaudMutation.mutate(id)}
          onUnApplaud={(id) => unApplaudMutation.mutate(id)}
          isFollowed={followingSet.has(item.user.id)}
          onFollow={(id) => followMutation.mutate(id)}
          onUnfollow={(id) => unfollowMutation.mutate(id)}
          isAuthenticated={isAuthenticated}
          currentUserId={currentUser?.id}
        />
      ))}

      <div ref={loadMoreRef} className="py-4 flex justify-center">
        {isFetchingNextPage && (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        )}
        {!hasNextPage && allFeedItems.length > 0 && (
          <p className="text-sm text-muted-foreground">You've reached the end</p>
        )}
      </div>
    </div>
  );
}
