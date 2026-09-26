import { Plugin } from "@opencode/plugin/tui"
import { createSignal, onCleanup } from "solid-js"

export default Plugin.define({
  id: "tui-clock",
  setup(context) {
    const pad = (n: number) => String(n).padStart(2, "0")

    const formatDateTime = () => {
      const now = new Date()
      const yyyy = now.getFullYear()
      const mm = pad(now.getMonth() + 1)
      const dd = pad(now.getDate())
      const hh = pad(now.getHours())
      const min = pad(now.getMinutes())
      const ss = pad(now.getSeconds())
      return `${yyyy}/${mm}/${dd} - ${hh}:${min}:${ss}`
    }

    const ClockWidget = () => {
      const [display, setDisplay] = createSignal(formatDateTime())
      const timer = setInterval(() => setDisplay(formatDateTime()), 1000)
      onCleanup(() => clearInterval(timer))

      return (
        <box flexDirection="row" flexShrink={0}>
          <text fg={context.theme.text.muted} wrapMode="none">
            {display()}
          </text>
        </box>
      )
    }

    return context.ui.slot({
      append: "prompt.footer",
      render: () => <ClockWidget />,
    })
  },
})
