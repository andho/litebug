import lustre/attribute
import theme

import sketch/css
import sketch/css/length.{px}
import sketch/lustre/element
import sketch/lustre/element/html

pub fn text_input(
  label: String,
  value: String,
  on_change: attribute.Attribute(a),
) -> element.Element(a) {
  let text_color = theme.color(theme.Text)
  let class = css.class([])

  html.div(
    css.class([
      css.flex("1"),
      css.display("flex"),
      css.flex_direction("column"),
      css.gap(px(4)),
    ]),
    [],
    [
      html.div(css.class([css.color(text_color), css.font_size(px(12))]), [], [
        html.text(label),
      ]),
      html.input(
        css.class([
          css.border_radius(px(6)),
          css.border_color(theme.color(theme.Border)),
          css.border_width(px(1)),
          css.border_style("solid"),
          css.background_color(theme.color(theme.InputBg)),
          css.color(theme.color(theme.TextSoft)),
          css.height(px(32)),
          css.padding_left(px(12)),
          css.padding_right(px(12)),
        ]),
        [attribute.type_("text"), attribute.value(value), on_change],
      ),
    ],
  )
}
