import gleam/option.{None, Some}
import lustre/attribute

import sketch/css
import sketch/css/length.{px}
import sketch/lustre/element
import sketch/lustre/element/html

pub type ButtonIntent {
  Success
  Warn
  Danger
  Default
}

pub fn button(
  label: String,
  variant: ButtonIntent,
  on_click: option.Option(attribute.Attribute(a)),
) -> element.Element(a) {
  let bg_color = case variant {
    Success -> "green"
    Warn -> "yellow"
    Danger -> "red"
    Default -> "blue"
  }
  let class = css.class([css.background(bg_color), css.padding(px(10))])
  html.button(
    class,
    case on_click {
      Some(on_click) -> [on_click]
      None -> []
    },
    [element.text(label)],
  )
}
