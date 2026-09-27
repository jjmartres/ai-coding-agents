#!/usr/bin/env fish
# scripts/update-google-skills.fish
# Checks upstream changes for vendor/google-skills, displays diff,
# and prompts for human confirmation before bumping the submodule pointer.

set -l script_dir (status dirname)
set -l repo_root (path resolve "$script_dir/..")
set -l submod_dir "$repo_root/vendor/google-skills"

if not test -d "$submod_dir"
    echo "Error: Submodule directory not found at $submod_dir" >&2
    echo "Please initialize submodules first: git submodule update --init --recursive" >&2
    exit 1
end

echo "Fetching latest upstream changes for google/skills..."
git -C "$submod_dir" fetch origin

set -l current_commit (git -C "$submod_dir" rev-parse HEAD)
set -l upstream_branch "origin/main"
set -l upstream_commit (git -C "$submod_dir" rev-parse "$upstream_branch")

if test "$current_commit" = "$upstream_commit"
    echo "✓ Submodule is already up to date at $current_commit ($upstream_branch)"
    exit 0
end

echo ""
echo "=================================================="
echo "Upstream updates available for vendor/google-skills"
echo "Current pin:  $current_commit"
echo "Upstream pin: $upstream_commit ($upstream_branch)"
echo "=================================================="
echo ""
echo "Commit log:"
git -C "$submod_dir" log --oneline --graph "$current_commit..$upstream_commit"
echo ""
echo "Diff summary:"
git -C "$submod_dir" diff --stat "$current_commit" "$upstream_commit"
echo ""

read -P "Do you want to update the submodule pin to $upstream_commit? [y/N]: " confirm

switch (string lower "$confirm")
    case y yes
        echo "Updating submodule pin..."
        git -C "$submod_dir" checkout "$upstream_commit"
        git -C "$repo_root" add vendor/google-skills
        echo "✓ Submodule pin updated to $upstream_commit"

        echo "Regenerating local skills index..."
        fish "$script_dir/google-skills-gen-index.fish"

        echo "Done. Submodule bump is staged in git. Review and commit when ready:"
        echo "  git diff --cached vendor/google-skills"
    case '*'
        echo "Submodule update cancelled. Submodule remains pinned at $current_commit."
        exit 0
end
