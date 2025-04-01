import gleam/bool
import gleam/list
import gleam/option.{None, Some}
import lustre/attribute
import theme

import sketch/css
import sketch/css/length.{px}
import sketch/lustre/element
import sketch/lustre/element/html

pub type ButtonIntent {
  Primary
  Secondary
  Warn
  Danger
}

pub type ButtonAttribute {
  Disabled(Bool)
}

pub fn button(
  label: String,
  variant: ButtonIntent,
  on_click: option.Option(attribute.Attribute(a)),
  attributes: List(ButtonAttribute),
) -> element.Element(a) {
  let attrs =
    list.map(attributes, fn(attr) {
      case attr {
        Disabled(True) -> attribute.disabled(True)
        Disabled(False) -> attribute.disabled(False)
      }
    })

  let disabled =
    list.any(attributes, fn(attr) {
      case attr {
        Disabled(True) -> True
        Disabled(False) -> False
      }
    })

  let bg_color = case variant, disabled {
    Primary, False -> theme.color(theme.ButtonBgPrimary)
    Primary, True -> theme.color(theme.ButtonBgPrimaryDisabled)
    Secondary, False -> theme.color(theme.ButtonBgSecondary)
    Secondary, True -> theme.color(theme.ButtonBgSecondaryDisabled)
    Warn, False -> theme.color(theme.ButtonBgWarn)
    Warn, True -> theme.color(theme.ButtonBgWarnDisabled)
    Danger, False -> theme.color(theme.ButtonBgDanger)
    Danger, True -> theme.color(theme.ButtonBgDangerDisabled)
  }
  let text_color = case variant, disabled {
    Primary, False -> theme.color(theme.ButtonTextPrimary)
    Primary, True -> theme.color(theme.ButtonTextPrimaryDisabled)
    Secondary, False -> theme.color(theme.ButtonTextSecondary)
    Secondary, True -> theme.color(theme.ButtonTextSecondaryDisabled)
    Warn, False -> theme.color(theme.ButtonTextWarn)
    Warn, True -> theme.color(theme.ButtonTextWarnDisabled)
    Danger, False -> theme.color(theme.ButtonTextDanger)
    Danger, True -> theme.color(theme.ButtonTextDangerDisabled)
  }
  let class =
    css.class([
      css.background(bg_color),
      css.color(text_color),
      css.padding_top(px(10)),
      css.padding_bottom(px(10)),
      css.padding_left(px(12)),
      css.padding_right(px(12)),
      css.border_radius(px(6)),
      css.font_size(px(14)),
    ])
  html.button(
    class,
    case on_click {
      Some(on_click) -> [on_click]
      None -> []
    }
      |> list.append(attrs),
    [element.text(label)],
  )
}

pub fn link_button(
  label: String,
  variant: ButtonIntent,
  href: String,
) -> element.Element(a) {
  let bg_color = case variant {
    Primary -> theme.color(theme.ButtonBgPrimary)
    Secondary -> theme.color(theme.ButtonBgSecondary)
    Warn -> theme.color(theme.ButtonBgWarn)
    Danger -> theme.color(theme.ButtonBgDanger)
  }
  let text_color = case variant {
    Primary -> theme.color(theme.ButtonTextPrimary)
    Secondary -> theme.color(theme.ButtonTextSecondary)
    Warn -> theme.color(theme.ButtonTextWarn)
    Danger -> theme.color(theme.ButtonTextDanger)
  }
  let class =
    css.class([
      css.background(bg_color),
      css.color(text_color),
      css.padding_top(px(10)),
      css.padding_bottom(px(10)),
      css.padding_left(px(12)),
      css.padding_right(px(12)),
      css.border_radius(px(6)),
      css.font_size(px(14)),
      css.text_decoration("none"),
    ])
  html.a(class, [attribute.href(href)], [element.text(label)])
}
