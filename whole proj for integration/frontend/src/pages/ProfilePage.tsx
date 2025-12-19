import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Briefcase,
  Building2,
  Camera,
  Shield,
  Code,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ProfilePage: React.FC = () => {
  const { user, updateUserAvatar } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64 for demo purposes
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        updateUserAvatar(base64);
        toast({
          title: "Profile Updated",
          description: "Your profile picture has been updated",
        });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Shield className="w-4 h-4" />;
      case "MANAGER":
        return <img src="/ust-logo.svg" alt="UST" className="w-4 h-4" />;
      default:
        return <Code className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-destructive/10 text-destructive";
      case "MANAGER":
        return "bg-warning/10 text-warning";
      default:
        return "bg-info/10 text-info";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          Profile
        </h1>
        <p className="text-muted-foreground">View and manage your profile</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass border-border/50">
            <CardContent className="p-6 flex flex-col items-center">
              <div className="relative group">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={user?.employee?.avatar} />
                  <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                    {user?.employee?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <h2 className="mt-4 text-xl font-bold text-foreground">
                {user?.employee?.name || "Unknown User"}
              </h2>
              <p className="text-muted-foreground">
                {user?.employee?.designation}
              </p>

              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {user?.roles.map((role) => (
                  <Badge key={role} className={cn("gap-1", getRoleColor(role))}>
                    {getRoleIcon(role)}
                    {role}
                  </Badge>
                ))}
              </div>

              <Separator className="my-4 w-full" />

              <div className="w-full space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {user?.employee?.email}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {user?.employee?.department || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <img src="/ust-logo.svg" alt="UST" className="w-4 h-4" />
                  <span className="text-muted-foreground">{user?.e_id}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2"
        >
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={user?.employee?.name || ""}
                    disabled
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Employee ID</Label>
                  <Input
                    value={user?.e_id || ""}
                    disabled
                    className="bg-secondary/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={user?.employee?.email || ""}
                    disabled
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Input
                    value={user?.employee?.designation || ""}
                    disabled
                    className="bg-secondary/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input
                    value={user?.employee?.department || "N/A"}
                    disabled
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-secondary/50">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-sm text-foreground">
                      {user?.status || "ACTIVE"}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Assigned Roles</Label>
                <div className="flex flex-wrap gap-2">
                  {user?.roles.map((role) => (
                    <div
                      key={role}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg",
                        getRoleColor(role)
                      )}
                    >
                      {getRoleIcon(role)}
                      <span className="font-medium">{role}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Note: To update your profile information, please contact your
                administrator.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
