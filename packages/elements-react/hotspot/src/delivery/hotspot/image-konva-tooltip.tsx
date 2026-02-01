// @ts-nocheck
/**
 * @synced-from pie-elements/packages/hotspot/src/hotspot/image-konva-tooltip.jsx
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Group, Image, Text, Tag, Label } from 'react-konva';

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
          width={20}
          height={20}
          x={x}
          y={y}
          image={image}
          onMouseEnter={() => this.setState({ showTooltip: true })}
          onMouseLeave={() => this.setState({ showTooltip: false })}
        />

        {showTooltip && tooltip && (
          <Label x={x - 30} y={y + 25}>
            <Tag fill="white" cornerRadius={5} opacity={0.9} />
            <Text text={tooltip} padding={5} />
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
