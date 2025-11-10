"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { OnboardingSteps } from "@/components/ui/onboarding-steps";

interface Props {
  icon: LucideIcon;
  title?: string;
  description?: string;
  onCreate?: () => void;
  onAddWorkspace?: () => void;
}

export function EmptyProjects({ icon: Icon, title = "No Projects Yet", description = "Create your first project to start deploying and managing your applications with Sarge.", onCreate, onAddWorkspace }: Props) {
  return (
    <motion.div
      className="glass-card p-12 text-center border border-white/10 max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Icon className="w-20 h-20 text-accent/50 mx-auto mb-4" />
      <h2 className="text-2xl sm:text-3xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-400 mb-8 max-w-2xl mx-auto">{description}</p>

      <div className="mb-8">
        <OnboardingSteps
          steps={[
            {
              number: 1,
              title: "Add a workspace",
              description:
                "Clone a GitHub repository or register a local project folder from the One-Click Deploy page.",
            },
            {
              number: 2,
              title: "Create your project",
              description:
                "Use the project wizard to set up your project with auto-detected configuration and build settings.",
            },
            {
              number: 3,
              title: "Deploy and manage",
              description:
                "Your project will be ready to deploy with automated builds, monitoring, and team collaboration.",
            },
          ]}
        />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <motion.button
          onClick={onCreate}
          className="px-6 py-3 bg-accent text-black rounded-lg hover:bg-accent/90 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Create Project
        </motion.button>
        <motion.button
          onClick={onAddWorkspace}
          className="px-6 py-3 bg-white/10 hover:bg-white/15 rounded-lg transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Add Workspace First
        </motion.button>
      </div>
    </motion.div>
  );
}
