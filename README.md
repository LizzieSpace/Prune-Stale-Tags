[//]: # ([![GitHub Super-Linter]&#40;https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg&#41;]&#40;https://github.com/super-linter/super-linter&#41;)
[//]: # (![CI]&#40;https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg&#41;)
[//]: # ([![Check dist/]&#40;https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg&#41;]&#40;https://github.com/actions/typescript-action/actions/workflows/check-dist.yml&#41;)
[//]: # ([![CodeQL]&#40;https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml/badge.svg&#41;]&#40;https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml&#41;)

[//]: # ([![Coverage]&#40;./coverage/coverage.svg&#41;]&#40;./coverage/coverage.svg&#41;)

<table class="images" align="center" style="border:0px solid white">
    <tr style="border: 0px;">
        <td style="border:0px">
            <a href="./coverage/coverage.svg">
                <img src="./coverage/coverage.svg"  alt="Coverage"/>
            </a> 
        </td>
        <td style="border:0px">
            <a href="https://github.com/actions/typescript-action/actions/workflows/check-dist.yml">
                <img src="https://github.com/actions/typescript-action/actions/workflows/check-dist.yml/badge.svg"  alt="Check dist/"/>
            </a> 
        </td>
        <td style="border:0px">
            <a href="https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml">
                <img src="https://github.com/actions/typescript-action/actions/workflows/ci.yml/badge.svg"  alt="CI"/>
            </a> 
        </td>
        <td  style="border:0px">
            <a href="">
                <img src="https://github.com/actions/typescript-action/actions/workflows/codeql-analysis.yml/badge.svg"  alt="CodeQL"/>
            </a> 
        </td>
        <td  style="border:0px">
            <a href="https://github.com/super-linter/super-linter">
                <img src="https://github.com/actions/typescript-action/actions/workflows/linter.yml/badge.svg"  alt="GitHub Super-Linter"/>
            </a> 
        </td>
    </tr>
</table>

# Prune tags Action

The action prunes selected releases and tags from a GitHub repository according
to their age and other specified criteria.

## Action Inputs

The action takes several inputs to control its behavior:

| Input name    | Description                                                                                                                                                                                                                                        | Required |    Default Value    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------: | :-----------------: |
| `pattern`     | Regex search pattern used to match tags. all tags containing this pattern will be selected.                                                                                                                                                        |   true   |   `.*` (all tags)   |
| `retention`   | Number of tags to keep. Latest tags are kept untouched, while older tags are removed as per `rm-tags` and `rm-releases`.                                                                                                                           |  false   |         `3`         |
| `rm-tags`     | Whether to prune associated tags.                                                                                                                                                                                                                  |  false   |       `false`       |
| `rm-releases` | Whether to remove associated releases.                                                                                                                                                                                                             |  false   |       `false`       |
| `dry-run`     | Runs the action as normal, but does not actually delete anything. Will return the JSON maps that would be used when attempting to remove refs.                                                                                                     |  false   |       `false`       |
| `repo-owner`  | Optionally specify the owner of the repo where the release should be generated. Defaults to current repo's owner.                                                                                                                                  |  false   | context repo owner  |
| `repo-name`   | Optionally specify the repo where the release should be generated. Defaults to current repo's name.                                                                                                                                                |  false   |  context repo name  |
| `token`       | The GitHub token. This will default to the GitHub app token. This is primarily useful if you want to use your personal token (for targeting other repos, etc). If you are using a personal access token it should have access to the `repo` scope. |  false   | `${{github.token}}` |

## Action Outputs

The action provides outputs that detail the results of the pruning process:

| Output name      | Description                                          |
| ---------------- | ---------------------------------------------------- |
| pruned-tags      | a JSON map of tags that got pruned as per `rm-tags`. |
| removed-releases | a JSON map of releases removed as per `rm-releases`. |
| kept-tags        | a JSON map of tags that got kept as per `retention`. |

[//]: # '## Example'
[//]: #
[//]: # 'This example will create a release when a tag is pushed:'
[//]: #
[//]: # '```yml'
[//]: # 'name: Releases'
[//]: #
[//]: # 'on:'
[//]: # '  push:'
[//]: # '    tags:'
[//]: # "      - '*'"
[//]: #
[//]: # 'jobs:'
[//]: # '  build:'
[//]: # '    runs-on: ubuntu-latest'
[//]: # '    permissions:'
[//]: # '      contents: write'
[//]: # '    steps:'
[//]: # '      - uses: actions/checkout@v3'
[//]: # '      - uses: ncipollo/release-action@v1'
[//]: # '        with:'
[//]: # "          artifacts: 'release.tar.gz,foo/*.txt'"
[//]: # "          bodyFile: 'body.md'"
[//]: # '```'

## Notes

- For safety reasons, the action does not remove any releases unless directly
  told to.
- the `dry-run` input can also be used to collect the tags metadata for other
  workflows to use, provided that you know some json manipulation magic.

[//]:
  #
  '- In the example above only required permissions for the action specified (which'
[//]: # '  is `contents: write`).'
