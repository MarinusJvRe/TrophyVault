import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { getAuthToken } from "@/lib/auth-token";

const FEED_PAGE_SIZE = 20;

export interface FeedTrophy {
  trophy: {
    id: string;
    userId: string;
    species: string;
    name: string;
    date: string;
    location: string | null;
    score: string | null;
    imageUrl: string | null;
    renderImageUrl: string | null;
    glbUrl: string | null;
    glbPreviewUrl: string | null;
    isAiAnalyzed: boolean;
    createdAt: string | null;
  };
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
  applaudCount: number;
  score: string | null;
}

export interface FeedResponse {
  items: FeedTrophy[];
  total: number;
  userApplauds: string[];
}

export function useCommunityFeed(feedMode: "global" | "following" = "global", feedSort: string = "newest", debouncedSearch: string = "") {
  const { user: currentUser, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const feedQueryParams = `?mode=${feedMode}&sort=${feedSort}&limit=${FEED_PAGE_SIZE}${debouncedSearch ? `&species=${encodeURIComponent(debouncedSearch)}&region=${encodeURIComponent(debouncedSearch)}` : ""}`;

  const {
    data: feedData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: feedLoading,
  } = useInfiniteQuery<FeedResponse>({
    queryKey: ["/api/community/feed", feedQueryParams],
    queryFn: async ({ pageParam = 0 }) => {
      const headers: Record<string, string> = {};
      const token = getAuthToken();
      if (token) {
        headers["X-Auth-Token"] = token;
      }
      const res = await fetch(`/api/community/feed${feedQueryParams}&offset=${pageParam}`, {
        credentials: "include",
        headers,
      });
      if (!res.ok) throw new Error("Failed to fetch feed");
      return res.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, p) => sum + p.items.length, 0);
      return loaded < lastPage.total ? loaded : undefined;
    },
    initialPageParam: 0,
  });

  const allFeedItems = feedData?.pages.flatMap(p => p.items) ?? [];
  const allUserApplauds = new Set(feedData?.pages.flatMap(p => p.userApplauds) ?? []);

  const { data: followingList = [] } = useQuery<string[]>({
    queryKey: ["/api/community/following"],
    enabled: isAuthenticated,
  });
  const followingSet = new Set(followingList);

  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("POST", `/api/community/follow/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/feed"] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/community/follow/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/feed"] });
    },
  });

  const applaudMutation = useMutation({
    mutationFn: async (trophyId: string) => {
      await apiRequest("POST", `/api/community/applaud/${trophyId}`);
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/feed"] });
    },
  });

  const unApplaudMutation = useMutation({
    mutationFn: async (trophyId: string) => {
      await apiRequest("DELETE", `/api/community/applaud/${trophyId}`);
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/feed"] });
    },
  });

  return {
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
  };
}
