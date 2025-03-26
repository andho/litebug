import lustre/attribute
import theme

import sketch/css
import sketch/css/length.{px}
import sketch/lustre/element
import sketch/lustre/element/html

pub fn text_input(
  _label: String,
  value: String,
  on_change: attribute.Attribute(a),
) -> element.Element(a) {
  let text_color = theme.color(theme.Text)
  let class = css.class([])
  html.input(class, [attribute.type_("text"), attribute.value(value), on_change])
}
