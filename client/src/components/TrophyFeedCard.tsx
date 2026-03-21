import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Trophy as TrophyIcon, ThumbsUp, MessageCircle, Eye, UserPlus, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { FeedTrophy } from "@/hooks/use-community-feed";

export default function TrophyFeedCard({
  item,
  isApplauded,
  onApplaud,
  onUnApplaud,
  isFollowed,
  onFollow,
  onUnfollow,
  isAuthenticated,
  currentUserId,
}: {
  item: FeedTrophy;
  isApplauded: boolean;
  onApplaud: (trophyId: string) => void;
  onUnApplaud: (trophyId: string) => void;
  isFollowed: boolean;
  onFollow: (userId: string) => void;
  onUnfollow: (userId: string) => void;
  isAuthenticated: boolean;
  currentUserId?: string;
}) {
  const { trophy, user, applaudCount } = item;
  const userName = user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : `User ${user.id.slice(0, 6)}`;
  const heroImage = trophy.imageUrl;
  const isOwnTrophy = currentUserId === user.id;
  const [localApplaudCount, setLocalApplaudCount] = useState(applaudCount);
  const [localApplauded, setLocalApplauded] = useState(isApplauded);

  useEffect(() => {
    setLocalApplaudCount(applaudCount);
  }, [applaudCount]);

  useEffect(() => {
    setLocalApplauded(isApplauded);
  }, [isApplauded]);

  const handleApplaud = () => {
    if (localApplauded) {
      setLocalApplauded(false);
      setLocalApplaudCount(c => Math.max(0, c - 1));
      onUnApplaud(trophy.id);
    } else {
      setLocalApplauded(true);
      setLocalApplaudCount(c => c + 1);
      onApplaud(trophy.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden border border-border/30 bg-card shadow-lg"
      data-testid={`card-feed-trophy-${trophy.id}`}
    >
      <div className="relative">
        {heroImage ? (
          <img
            src={heroImage}
            alt={trophy.species}
            className="w-full aspect-[4/3] object-cover"
            data-testid={`img-feed-trophy-${trophy.id}`}
          />
        ) : (
          <div className="w-full aspect-[4/3] bg-muted/30 flex items-center justify-center">
            <TrophyIcon className="h-16 w-16 text-muted-foreground/20" />
          </div>
        )}

        <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            <Link href={`/room/${user.id}`}>
              <div className="flex items-center gap-2 cursor-pointer" data-testid={`link-feed-user-${user.id}`}>
                <Avatar className="h-9 w-9 border-2 border-white/30">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-white/20 text-white text-xs font-serif">
                    {userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white text-sm font-semibold leading-tight drop-shadow">{userName}</p>
                  <p className="text-white/70 text-[11px] leading-tight drop-shadow">
                    {trophy.species} {trophy.location ? `• ${trophy.location}` : ""}
                  </p>
                </div>
              </div>
            </Link>

            {!isOwnTrophy && isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 px-2 text-[11px] gap-1 rounded-full border",
                  isFollowed
                    ? "bg-white/20 text-white border-white/30 hover:bg-white/30 hover:text-white"
                    : "bg-primary/80 text-white border-primary hover:bg-primary hover:text-white"
                )}
                onClick={() => isFollowed ? onUnfollow(user.id) : onFollow(user.id)}
                data-testid={`button-follow-${user.id}`}
              >
                {isFollowed ? <UserMinus className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                {isFollowed ? "Following" : "Follow"}
              </Button>
            )}
          </div>
        </div>

        {trophy.score && trophy.isAiAnalyzed && (
          <div className="absolute top-3 right-3 bg-primary/90 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-lg" data-testid={`badge-score-${trophy.id}`}>
            AI Verified Score: {trophy.score}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-white text-xs font-medium drop-shadow">
            {trophy.species} {trophy.location ? `• ${trophy.location}` : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-2.5 border-t border-border/20">
        <div className="flex items-center gap-3">
          <button
            className={cn(
              "flex items-center gap-1.5 text-sm transition-colors",
              localApplauded ? "text-primary font-semibold" : "text-muted-foreground hover:text-primary"
            )}
            onClick={handleApplaud}
            disabled={!isAuthenticated}
            data-testid={`button-applaud-${trophy.id}`}
          >
            <ThumbsUp className={cn("h-4 w-4", localApplauded && "fill-primary")} />
            <span>Applaud</span>
            {localApplaudCount > 0 && <span className="text-xs">{localApplaudCount.toLocaleString()}</span>}
          </button>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground/50 cursor-default" data-testid={`button-comment-${trophy.id}`}>
            <MessageCircle className="h-4 w-4" />
            <span>0</span>
          </div>
        </div>

        <Link href={`/room/${user.id}`}>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" data-testid={`button-view-trophy-${trophy.id}`}>
            <Eye className="h-3.5 w-3.5" />
            View Trophy
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
