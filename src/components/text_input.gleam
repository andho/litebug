import gleam/option
import lustre/attribute
import theme

import sketch/css
import sketch/css/length.{px}
import sketch/lustre/element
import sketch/lustre/element/html

pub fn text_input(
  label label: String,
  value value: String,
  on_change on_change: attribute.Attribute(a),
  error error: option.Option(String),
) -> element.Element(a) {
  let text_color = theme.color(theme.Text)

  html.div(
    css.class([
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
      case error {
        option.Some(error) ->
          html.div(
            css.class([
              css.color(theme.color(theme.TextError)),
              css.font_size(px(12)),
              css.margin_top(px(4)),
            ]),
            [],
            [html.text(error)],
          )
        option.None -> element.none()
      },
    ],
  )
}
