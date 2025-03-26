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

pub fn button(
  label: String,
  variant: ButtonIntent,
  on_click: option.Option(attribute.Attribute(a)),
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
    ])
  html.button(
    class,
    case on_click {
      Some(on_click) -> [on_click]
      None -> []
    },
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
