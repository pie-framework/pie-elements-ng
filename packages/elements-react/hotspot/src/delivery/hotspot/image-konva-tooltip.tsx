// @ts-nocheck

import React from 'react';
import PropTypes from 'prop-types';
import { Group as GroupImport, Image as ImageImport, Text as TextImport, Tag as TagImport, Label as LabelImport } from 'react-konva';

function isRenderableReactInteropType(value: any) {
  return (
    typeof value === 'function' ||
    (typeof value === 'object' && value !== null && typeof value.$$typeof === 'symbol')
  );
}

function unwrapReactInteropSymbol(maybeSymbol: any, namedExport?: string) {
  if (!maybeSymbol) return maybeSymbol;
  if (isRenderableReactInteropType(maybeSymbol)) return maybeSymbol;
  if (isRenderableReactInteropType(maybeSymbol.default)) return maybeSymbol.default;
  if (namedExport && isRenderableReactInteropType(maybeSymbol[namedExport])) {
    return maybeSymbol[namedExport];
  }
  if (namedExport && isRenderableReactInteropType(maybeSymbol[namedExport]?.default)) {
    return maybeSymbol[namedExport].default;
  }
  return maybeSymbol;
}
const Label = unwrapReactInteropSymbol(LabelImport, 'Label');
const Tag = unwrapReactInteropSymbol(TagImport, 'Tag');
const Text = unwrapReactInteropSymbol(TextImport, 'Text');
const Image = unwrapReactInteropSymbol(ImageImport, 'Image');
const Group = unwrapReactInteropSymbol(GroupImport, 'Group');

const ICON_SIZE = 20;
// Wraps the English evaluate text onto two lines, as its hard-coded line breaks used to.
const TOOLTIP_WIDTH = 100;

class ImageComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      image: null,
      showTooltip: false,
    };
  }

  componentDidMount() {
    this.loadImage();
  }

  componentDidUpdate(oldProps) {
    if (oldProps.src !== this.props.src) {
      this.loadImage();
    }
  }

  componentWillUnmount() {
    this.image.removeEventListener('load', this.handleLoad);
  }

  loadImage() {
    const { src } = this.props;

    this.image = new window.Image();
    this.image.src = src;
    this.image.addEventListener('load', this.handleLoad);
  }

  handleLoad: any = () => {
    this.setState({
      image: this.image,
    });
  };

  render() {
    const { x, y, tooltip } = this.props;
    const { image, showTooltip } = this.state;

    return (
      <Group>
        <Image
          width={ICON_SIZE}
          height={ICON_SIZE}
          x={x}
          y={y}
          image={image}
          onMouseEnter={() => this.setState({ showTooltip: true })}
          onMouseLeave={() => this.setState({ showTooltip: false })}
        />

        {showTooltip && tooltip && (
          <Label x={x + ICON_SIZE / 2 - TOOLTIP_WIDTH / 2} y={y + 25}>
            <Tag fill="white" cornerRadius={5} opacity={0.9} />
            <Text text={tooltip} padding={5} width={TOOLTIP_WIDTH} align="center" />
          </Label>
        )}
      </Group>
    );
  }
}

ImageComponent.propTypes = {
  src: PropTypes.string.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  tooltip: PropTypes.string.isRequired,
};

export default ImageComponent;
