import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";

export default function OrganizationSignupScreen() {
  const [formData, setFormData] = useState({
    organizationName: "",
    slug: "",
    adminName: "",
    adminEmail: "",
    contactPhone: "",
    address: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createOrgMutation = trpc.onboarding.createOrganization.useMutation({
    onSuccess: (data) => {
      alert(`Success! ${data.message}\n\nPlease sign in to continue.`);
      router.replace("/");
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.organizationName.trim()) {
      newErrors.organizationName = "Organization name is required";
    }

    if (!formData.slug.trim()) {
      newErrors.slug = "URL slug is required";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = "Slug must contain only lowercase letters, numbers, and hyphens";
    }

    if (!formData.adminName.trim()) {
      newErrors.adminName = "Admin name is required";
    }

    if (!formData.adminEmail.trim()) {
      newErrors.adminEmail = "Admin email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      newErrors.adminEmail = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    createOrgMutation.mutate({
      organizationName: formData.organizationName,
      slug: formData.slug,
      adminName: formData.adminName,
      adminEmail: formData.adminEmail,
      contactPhone: formData.contactPhone || undefined,
      address: formData.address || undefined,
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-6">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-2xl font-bold text-foreground mb-2">
            Create Your Organization
          </Text>
          <Text className="text-base text-muted">
            Start your 30-day free trial. No credit card required.
          </Text>
        </View>

        {/* Organization Details */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-foreground mb-4">
            Organization Details
          </Text>

          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">
              Organization Name *
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-xl p-4 text-foreground"
              placeholder="e.g., Account Hackney"
              value={formData.organizationName}
              onChangeText={(text) => {
                setFormData({ ...formData, organizationName: text });
                if (!formData.slug) {
                  setFormData((prev) => ({ ...prev, slug: generateSlug(text) }));
                }
              }}
            />
            {errors.organizationName && (
              <Text className="text-error text-sm mt-1">{errors.organizationName}</Text>
            )}
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">
              URL Slug *
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-xl p-4 text-foreground"
              placeholder="e.g., account-hackney"
              value={formData.slug}
              onChangeText={(text) => setFormData({ ...formData, slug: text.toLowerCase() })}
              autoCapitalize="none"
            />
            <Text className="text-xs text-muted leading-relaxed mt-1">
              Your organization URL: changeinyouth.app/{formData.slug || "your-slug"}
            </Text>
            {errors.slug && <Text className="text-error text-sm mt-1">{errors.slug}</Text>}
          </View>
        </View>

        {/* Admin User */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-foreground mb-4">
            Admin User
          </Text>

          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">
              Full Name *
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-xl p-4 text-foreground"
              placeholder="e.g., John Smith"
              value={formData.adminName}
              onChangeText={(text) => setFormData({ ...formData, adminName: text })}
            />
            {errors.adminName && (
              <Text className="text-error text-sm mt-1">{errors.adminName}</Text>
            )}
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">
              Email Address *
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-xl p-4 text-foreground"
              placeholder="e.g., john@accounthackney.org"
              value={formData.adminEmail}
              onChangeText={(text) => setFormData({ ...formData, adminEmail: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.adminEmail && (
              <Text className="text-error text-sm mt-1">{errors.adminEmail}</Text>
            )}
          </View>
        </View>

        {/* Optional Contact Info */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-foreground mb-4">
            Contact Information (Optional)
          </Text>

          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">Phone Number</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl p-4 text-foreground"
              placeholder="e.g., +44 20 1234 5678"
              value={formData.contactPhone}
              onChangeText={(text) => setFormData({ ...formData, contactPhone: text })}
              keyboardType="phone-pad"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">Address</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl p-4 text-foreground"
              placeholder="e.g., 123 High Street, London, UK"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          className="bg-primary rounded-full p-4 items-center mb-4"
          onPress={handleSubmit}
          disabled={createOrgMutation.isPending}
          style={{ opacity: createOrgMutation.isPending ? 0.6 : 1 }}
        >
          {createOrgMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">
              Create Organization & Start Trial
            </Text>
          )}
        </TouchableOpacity>

        {/* Back to Login */}
        

        {/* Features List */}
        <View className="bg-blue-50 rounded-2xl p-6 mb-4 border border-blue-200">
          <Text className="text-lg font-semibold text-blue-900 mb-3">
            ✨ What's Included in Your Trial
          </Text>
          <Text className="text-sm text-blue-800 mb-2">• Up to 10 team members</Text>
          <Text className="text-sm text-blue-800 mb-2">• Unlimited projects & sessions</Text>
          <Text className="text-sm text-blue-800 mb-2">• Budget & finance management</Text>
          <Text className="text-sm text-blue-800 mb-2">• Digital consent forms</Text>
          <Text className="text-sm text-blue-800 mb-2">• Team performance tracking</Text>
          <Text className="text-sm text-blue-800">• 30 days free, no credit card required</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
