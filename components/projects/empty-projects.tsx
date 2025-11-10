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
    <div className="relative min-h-[520px] w-full flex items-center justify-center">
      {/* neon ring backlight */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <div className="h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.25),transparent_60%)] blur-2xl" />
      </div>

      {/* scanlines + grid */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08] [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.6)_0,rgba(255,255,255,0.6)_1px,transparent_1px,transparent_6px)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(0deg,transparent_24%,rgba(255,255,255,.06)_25%,rgba(255,255,255,.06)_26%,transparent_27%,transparent_74%,rgba(255,255,255,.06)_75%,rgba(255,255,255,.06)_76%,transparent_77%),linear-gradient(90deg,transparent_24%,rgba(255,255,255,.06)_25%,rgba(255,255,255,.06)_26%,transparent_27%,transparent_74%,rgba(255,255,255,.06)_75%,rgba(255,255,255,.06)_76%,transparent_77%)] bg-[size:50px_50px]" />

      <div className="glass-card w-full max-w-4xl mx-auto rounded-2xl border border-white/10 p-8 sm:p-10">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 180, damping: 12 }}
            className="mb-6 relative"
          >
            <div className="absolute -inset-3 rounded-full bg-[conic-gradient(from_90deg,rgba(168,85,247,0.30),transparent_60%)] blur-lg" />
            <div className="relative p-6 rounded-full border border-accent/40 bg-accent/10 backdrop-blur-sm shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_0_40px_rgba(168,85,247,0.25)]">
              <Icon className="w-14 h-14 text-accent drop-shadow-[0_0_10px_rgba(168,85,247,0.6)]" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-3xl sm:text-4xl font-bold mb-3 bg-gradient-to-r from-accent via-fuchsia-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(168,85,247,0.45)]"
          >
            {title}
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="max-w-2xl text-gray-400/90 mb-8"
          >
            {description}
          </motion.p>

          {/* Steps */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="w-full"
          >
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
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="mt-8 flex flex-col sm:flex-row items-center gap-3"
          >
            <button
              onClick={onCreate}
              className="px-6 py-3 rounded-lg font-medium bg-gradient-to-r from-accent to-purple-500 text-white hover:brightness-110 transition-all shadow-[0_0_25px_rgba(168,85,247,0.35)] border border-accent/40"
            >
              Create Project
            </button>
            <button
              onClick={onAddWorkspace}
              className="px-6 py-3 rounded-lg font-medium border border-white/15 bg-white/5 hover:bg-white/10 transition-all text-gray-200"
            >
              Add Workspace First
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
