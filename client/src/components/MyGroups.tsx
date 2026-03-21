import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UsersRound,
  MapPin,
  Users,
  Trophy as TrophyIcon,
  Plus,
  ArrowLeft,
  UserPlus,
  Trash2,
  Share2,
  Crown,
  Mail,
  Check,
  X,
  Loader2,
} from "lucide-react";
import type { Group, GroupMember, GroupInvite, Trophy, GroupTrophy } from "@shared/schema";

type GroupWithCount = Group & {
  memberCount: number;
  trophyCount: number;
  memberPreviews: { id: string; firstName: string | null; profileImageUrl: string | null }[];
};
type MemberWithUser = GroupMember & {
  user: { id: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null };
};
type InviteWithDetails = GroupInvite & {
  group: Group;
  invitedBy: { id: string; firstName: string | null; lastName: string | null };
};
type GroupTrophyWithTrophy = GroupTrophy & { trophy: Trophy };

export function useGroupInviteCount() {
  const { isAuthenticated } = useAuth();
  const { data: invites = [] } = useQuery<InviteWithDetails[]>({
    queryKey: ["/api/groups/invites"],
    enabled: isAuthenticated,
  });
  return invites.length;
}

export default function MyGroups() {
  const { user, isAuthenticated } = useAuth();

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: groups = [], isLoading: groupsLoading } = useQuery<GroupWithCount[]>({
    queryKey: ["/api/groups"],
    enabled: isAuthenticated,
  });

  const { data: invites = [] } = useQuery<InviteWithDetails[]>({
    queryKey: ["/api/groups/invites"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <UsersRound className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p className="font-serif text-lg">Sign in to view your groups</p>
        <p className="text-sm mt-1">Create or join hunting groups with shared trophy rooms</p>
      </div>
    );
  }

  if (selectedGroupId) {
    return (
      <GroupDetail
        groupId={selectedGroupId}
        onBack={() => setSelectedGroupId(null)}
        currentUserId={user?.id}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Create or join hunting groups with shared trophy rooms
        </p>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => setShowCreateDialog(true)}
          data-testid="button-create-group"
        >
          <Plus className="h-4 w-4" />
          Create Group
        </Button>
      </div>

      {invites.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-serif font-semibold flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            Pending Invitations
            <Badge variant="secondary" className="ml-1" data-testid="badge-invite-count">
              {invites.length}
            </Badge>
          </h3>
          {invites.map((invite) => (
            <InviteCard key={invite.id} invite={invite} />
          ))}
        </div>
      )}

      {groupsLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <UsersRound className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-serif text-lg">No groups yet</p>
          <p className="text-sm mt-1">Create a group to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group, i) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="bg-card border-border/40 h-full relative overflow-hidden cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => setSelectedGroupId(group.id)}
                data-testid={`card-group-${group.id}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                <CardContent className="p-5 relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-primary/10 rounded-lg">
                        <UsersRound className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-serif font-semibold leading-tight">{group.name}</h3>
                        {group.region && (
                          <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {group.region}
                          </div>
                        )}
                      </div>
                    </div>
                    {group.adminUserId === user?.id && (
                      <Badge variant="outline" className="text-[10px] gap-1 shrink-0">
                        <Crown className="h-2.5 w-2.5" />
                        Admin
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid={`text-member-count-${group.id}`}>
                      <Users className="h-3.5 w-3.5" />
                      <span>{group.memberCount} {group.memberCount === 1 ? "member" : "members"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid={`text-trophy-count-${group.id}`}>
                      <TrophyIcon className="h-3.5 w-3.5 text-primary" />
                      <span>{group.trophyCount} {group.trophyCount === 1 ? "trophy" : "trophies"}</span>
                    </div>
                  </div>

                  {group.memberPreviews.length > 0 && (
                    <div className="flex -space-x-2 mt-4">
                      {group.memberPreviews.map((member) => (
                        <Avatar key={member.id} className="h-7 w-7 border-2 border-card">
                          <AvatarImage src={member.profileImageUrl || undefined} />
                          <AvatarFallback className="text-[10px] font-medium bg-muted text-muted-foreground">
                            {member.firstName?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {group.memberCount > 5 && (
                        <div className="h-7 w-7 rounded-full bg-primary/10 border-2 border-card flex items-center justify-center text-[10px] font-medium text-primary">
                          +{group.memberCount - 5}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <CreateGroupDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </div>
  );
}

function InviteCard({ invite }: { invite: InviteWithDetails }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const inviterName = invite.invitedBy.firstName
    ? `${invite.invitedBy.firstName} ${invite.invitedBy.lastName || ""}`.trim()
    : "Someone";

  const respondMutation = useMutation({
    mutationFn: async (accept: boolean) => {
      await apiRequest("POST", `/api/groups/invites/${invite.id}/respond`, { accept });
    },
    onSuccess: (_data, accept) => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups/invites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: accept ? "Invitation accepted" : "Invitation declined",
        description: accept ? `You joined ${invite.group.name}` : `Declined invite to ${invite.group.name}`,
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to respond to invitation", variant: "destructive" });
    },
  });

  return (
    <Card className="bg-primary/5 border-primary/20" data-testid={`card-invite-${invite.id}`}>
      <CardContent className="p-4 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{invite.group.name}</p>
          <p className="text-xs text-muted-foreground">
            Invited by {inviterName}
            {invite.group.region && ` • ${invite.group.region}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1"
            onClick={() => respondMutation.mutate(false)}
            disabled={respondMutation.isPending}
            data-testid={`button-decline-invite-${invite.id}`}
          >
            <X className="h-3.5 w-3.5" />
            Decline
          </Button>
          <Button
            size="sm"
            className="h-8 gap-1"
            onClick={() => respondMutation.mutate(true)}
            disabled={respondMutation.isPending}
            data-testid={`button-accept-invite-${invite.id}`}
          >
            {respondMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Accept
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateGroupDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/groups", {
        name,
        region: region || undefined,
        description: description || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({ title: "Group created", description: `"${name}" has been created` });
      setName("");
      setRegion("");
      setDescription("");
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Create a Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name *</Label>
            <Input
              id="group-name"
              placeholder='e.g. "Jones Family Rocky Mountains 2025"'
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="input-group-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="group-region">Region</Label>
            <Input
              id="group-region"
              placeholder="e.g. Rocky Mountains, CO"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              data-testid="input-group-region"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="group-description">Description</Label>
            <Textarea
              id="group-description"
              placeholder="Describe your group..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              data-testid="input-group-description"
            />
          </div>
          <Button
            className="w-full"
            onClick={() => createMutation.mutate()}
            disabled={!name.trim() || createMutation.isPending}
            data-testid="button-submit-create-group"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Create Group
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GroupDetail({
  groupId,
  onBack,
  currentUserId,
}: {
  groupId: string;
  onBack: () => void;
  currentUserId?: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showShareTrophyDialog, setShowShareTrophyDialog] = useState(false);

  const { data: groupData, isLoading } = useQuery<{ group: Group; members: MemberWithUser[] }>({
    queryKey: [`/api/groups/${groupId}`],
  });

  const { data: groupTrophies = [], isLoading: trophiesLoading } = useQuery<GroupTrophyWithTrophy[]>({
    queryKey: [`/api/groups/${groupId}/trophies`],
  });

  const isAdmin = groupData?.group.adminUserId === currentUserId;

  const deleteGroupMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/groups/${groupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}`] });
      toast({ title: "Group deleted" });
      onBack();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const removeTrophyMutation = useMutation({
    mutationFn: async (trophyId: string) => {
      await apiRequest("DELETE", `/api/groups/${groupId}/trophies/${trophyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/trophies`] });
      toast({ title: "Trophy removed from group" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!groupData) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Group not found or you don't have access.</p>
        <Button variant="outline" className="mt-4" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Groups
        </Button>
      </div>
    );
  }

  const { group, members } = groupData;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-back-groups">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-serif font-bold truncate" data-testid="text-group-name">{group.name}</h2>
          {group.region && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {group.region}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setShowInviteDialog(true)}
                data-testid="button-invite-member"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Invite
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this group? This cannot be undone.")) {
                    deleteGroupMutation.mutate();
                  }
                }}
                disabled={deleteGroupMutation.isPending}
                data-testid="button-delete-group"
              >
                {deleteGroupMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {group.description && (
        <p className="text-sm text-muted-foreground" data-testid="text-group-description">{group.description}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border/40">
          <CardContent className="p-5">
            <h3 className="text-sm font-serif font-semibold mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Members ({members.length})
            </h3>
            <div className="space-y-3">
              {members.map((member) => {
                const memberName = member.user.firstName
                  ? `${member.user.firstName} ${member.user.lastName || ""}`.trim()
                  : `User ${member.user.id.slice(0, 6)}`;
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3"
                    data-testid={`row-member-${member.userId}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.user.profileImageUrl || undefined} />
                      <AvatarFallback className="text-xs font-serif bg-primary/10 text-primary">
                        {memberName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{memberName}</p>
                    </div>
                    {member.role === "admin" && (
                      <Badge variant="outline" className="text-[10px] gap-1 shrink-0">
                        <Crown className="h-2.5 w-2.5" />
                        Admin
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/40">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-serif font-semibold flex items-center gap-2">
                <TrophyIcon className="h-4 w-4 text-primary" />
                Shared Trophies ({groupTrophies.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setShowShareTrophyDialog(true)}
                data-testid="button-share-trophy"
              >
                <Share2 className="h-3.5 w-3.5" />
                Share Trophy
              </Button>
            </div>

            {trophiesLoading ? (
              <div className="flex items-center justify-center h-24">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : groupTrophies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrophyIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No trophies shared yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {groupTrophies.map((gt) => (
                  <div
                    key={gt.id}
                    className="group relative rounded-lg overflow-hidden border border-border/30"
                    data-testid={`card-group-trophy-${gt.trophyId}`}
                  >
                    {gt.trophy.imageUrl || gt.trophy.renderImageUrl ? (
                      <img
                        src={gt.trophy.renderImageUrl || gt.trophy.imageUrl!}
                        alt={gt.trophy.species}
                        className="w-full aspect-square object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-muted/30 flex items-center justify-center">
                        <TrophyIcon className="h-6 w-6 text-muted-foreground/20" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                      <p className="text-white text-[11px] font-medium truncate">{gt.trophy.species}</p>
                      {gt.trophy.score && (
                        <p className="text-white/70 text-[10px]">Score: {gt.trophy.score}</p>
                      )}
                    </div>
                    {(gt.sharedByUserId === currentUserId || isAdmin) && (
                      <button
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeTrophyMutation.mutate(gt.trophyId)}
                        data-testid={`button-remove-trophy-${gt.trophyId}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <InviteMemberDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        groupId={groupId}
      />

      <ShareTrophyDialog
        open={showShareTrophyDialog}
        onOpenChange={setShowShareTrophyDialog}
        groupId={groupId}
        currentUserId={currentUserId}
      />
    </div>
  );
}

function InviteMemberDialog({
  open,
  onOpenChange,
  groupId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groupId: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteValue, setInviteValue] = useState("");
  const [inviteType, setInviteType] = useState<"username" | "email">("email");

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const body = inviteType === "email"
        ? { email: inviteValue }
        : { username: inviteValue };
      await apiRequest("POST", `/api/groups/${groupId}/invite`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}`] });
      toast({ title: "Invitation sent" });
      setInviteValue("");
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">Invite Member</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Invite by</Label>
            <Select value={inviteType} onValueChange={(v) => setInviteType(v as "username" | "email")}>
              <SelectTrigger data-testid="select-invite-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="username">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{inviteType === "email" ? "Email Address" : "Name"}</Label>
            <Input
              placeholder={inviteType === "email" ? "user@example.com" : "Enter name..."}
              value={inviteValue}
              onChange={(e) => setInviteValue(e.target.value)}
              data-testid="input-invite-value"
            />
          </div>
          <Button
            className="w-full"
            onClick={() => inviteMutation.mutate()}
            disabled={!inviteValue.trim() || inviteMutation.isPending}
            data-testid="button-submit-invite"
          >
            {inviteMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            Send Invitation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ShareTrophyDialog({
  open,
  onOpenChange,
  groupId,
  currentUserId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groupId: string;
  currentUserId?: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: myTrophies = [], isLoading } = useQuery<Trophy[]>({
    queryKey: ["/api/trophies"],
    enabled: open,
  });

  const shareMutation = useMutation({
    mutationFn: async (trophyId: string) => {
      await apiRequest("POST", `/api/groups/${groupId}/trophies`, { trophyId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${groupId}/trophies`] });
      toast({ title: "Trophy shared to group" });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-serif">Share Trophy to Group</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-2 pt-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : myTrophies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrophyIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">You don't have any trophies to share</p>
            </div>
          ) : (
            myTrophies.map((trophy) => (
              <div
                key={trophy.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/30 hover:bg-primary/5 cursor-pointer transition-colors"
                onClick={() => shareMutation.mutate(trophy.id)}
                data-testid={`button-share-trophy-${trophy.id}`}
              >
                {(trophy.renderImageUrl || trophy.imageUrl) ? (
                  <div className="h-12 w-12 rounded overflow-hidden border border-border/30 shrink-0">
                    <img
                      src={trophy.renderImageUrl || trophy.imageUrl!}
                      alt={trophy.species}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded bg-muted/30 flex items-center justify-center shrink-0">
                    <TrophyIcon className="h-5 w-5 text-muted-foreground/30" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{trophy.species}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {trophy.name}
                    {trophy.score && ` • Score: ${trophy.score}`}
                  </p>
                </div>
                {shareMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                ) : (
                  <Share2 className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
