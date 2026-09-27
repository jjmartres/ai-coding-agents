#!/usr/bin/env fish
# scripts/google-skills-gen-index.fish
# Generates generated/google-skills-index.local.json with absolute local paths.

set -l script_dir (status dirname)
set -l repo_root (path resolve "$script_dir/..")
set -l skills_dir "$repo_root/vendor/google-skills/skills/cloud"
set -l output_dir "$repo_root/generated"
set -l output_file "$output_dir/google-skills-index.local.json"

if not command -v jq >/dev/null 2>&1
    echo "Error: jq is required but not installed." >&2
    exit 1
end

if not test -d "$skills_dir"
    echo "Error: Submodule directory not found at $skills_dir" >&2
    echo "Please run: git submodule update --init --recursive" >&2
    exit 1
end

mkdir -p "$output_dir"
set -l temp_file (mktemp)

for skill_file in (find "$skills_dir" -mindepth 2 -maxdepth 2 -name "SKILL.md" | sort)
    set -l skill_dir (path dirname "$skill_file")
    set -l skill_name (path basename "$skill_dir")

    # Exclude finding-google-skills
    test "$skill_name" = "finding-google-skills"; and continue

    set -l parsed (awk '
    BEGIN { in_fm=0; name=""; desc=""; in_desc=0 }
    /^---$/ {
      if (in_fm == 0) { in_fm=1; next }
      else { exit }
    }
    in_fm {
      if ($1 == "name:") {
        name = $2
        in_desc = 0
      } else if ($1 == "description:" || $1 ~ /^description:/) {
        in_desc = 1
        sub(/^description:[ \t]*/, "")
        sub(/^[>|]-?[ \t]*/, "")
        desc = $0
      } else if (in_desc && /^[ \t]+/) {
        sub(/^[ \t]+/, "")
        if (desc == "") desc = $0
        else desc = desc " " $0
      } else if (/^[a-zA-Z0-9_-]+:/) {
        in_desc = 0
      }
    }
    END {
      printf "%s\n%s\n", name, desc
    }
    ' "$skill_file")

    set -l s_name $parsed[1]
    if test -z "$s_name"
        set s_name "$skill_name"
    end
    set -l s_desc (string join " " $parsed[2..-1])

    jq -n --arg name "$s_name" --arg desc "$s_desc" --arg entry "$skill_file" \
      '{name: $name, description: $desc, entrypoint: $entry}' >> "$temp_file"
end

jq -s '{skills: .}' "$temp_file" > "$output_file"
rm -f "$temp_file"

set -l total (jq '.skills | length' "$output_file")
echo "✓ Generated $output_file with $total skills"
