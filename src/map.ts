import * as loadScript from 'load-script';
import { toTypedValue } from 'maraca';

import getColor from './color';
import { extract } from './utils';
import render from './index';

const mapListeners = [] as any[];
const withMapScript = onReady => {
  if ((window as any).google) {
    onReady();
  } else {
    mapListeners.push(onReady);
    if (mapListeners.length === 1) {
      loadScript(
        'https://maps.googleapis.com/maps/api/js?key=AIzaSyCQ8P7-0kTGz2_tkcHjOo0IUiMB_z9Bbp4',
        () => mapListeners.forEach(l => l()),
      );
    }
  }
};
const linkMap = (node, onReady) => {
  withMapScript(() => {
    if (node.__mapInstance) {
      onReady(node.__mapInstance);
    } else {
      const div = document.createElement('div');
      div.style.height = '100%';
      node.appendChild(div);
      node.__mapInstance = new (window as any).google.maps.Map(div);
      onReady(node.__mapInstance);
    }
  });
};

const icons = {
  question: '1594-help_4x.png',
  star: '1502-shape_star_4x.png',
};
const iconImage = (icon, color, size) =>
  `https://mt.google.com/vt/icon/name=icons/onion/SHARED-mymaps-container-bg_4x.png,icons/onion/SHARED-mymaps-container_4x.png,icons/onion/${
    icons[icon]
  }&highlight=ff000000,${getColor(color, true)},ff000000&scale=${size}`;

export default (node, _, indices) => {
  node.style.height = '500px';
  linkMap(node, map => {
    let setBounds = false;
    if (!node.__map) {
      node.__map = {
        markers: [],
        info: new (window as any).google.maps.InfoWindow(),
      };
      setBounds = true;
    }
    const bounds = new (window as any).google.maps.LatLngBounds();
    const newMarkers: any = [];
    const items = indices
      .map(d => ({
        ...extract(d.value.values).values,
        info: d.value.values.info && d.value.values.info.value,
      }))
      .map(({ position, icon, color, size, fit, info }) => ({
        position: toTypedValue({ type: 'value', value: `${position}` }),
        icon: iconImage(icon, color, size),
        fit,
        info,
      }))
      .filter(d => d.position.type === 'location')
      .map(d => ({
        position: d.position.value,
        icon: d.icon,
        fit: d.fit,
        info: d.info,
      }));
    Array.from({
      length: Math.max(node.__map.markers.length, items.length),
    }).forEach((_, i) => {
      const marker = node.__map.markers[i];
      const item = items[i];
      if (!item) {
        marker.setMap(null);
        setBounds = true;
      } else {
        if (marker) {
          if (
            Math.ceil(marker.getPosition().lat() * 10000) !==
              Math.ceil(item.position.lat * 10000) ||
            Math.ceil(marker.getPosition().lng() * 10000) !==
              Math.ceil(item.position.lng * 10000)
          ) {
            setBounds = true;
          }
          marker.setPosition(item.position);
          marker.setIcon(item.icon);
        } else {
          setBounds = true;
        }
        const result =
          marker ||
          new (window as any).google.maps.Marker({
            map,
            position: item.position,
            icon: item.icon,
            ...(item.fit
              ? { zIndex: (window as any).google.maps.Marker.MAX_ZINDEX + 1 }
              : {}),
          });
        if (item.fit) bounds.extend(item.position);
        if (item.info) {
          result.addListener('click', () => {
            const div = render(document.createElement('div'), item.info);
            div.style.maxWidth = '350px';
            node.__map.info.setContent(div);
            node.__map.info.open(map, marker);
          });
        }
        newMarkers.push(result);
      }
    });
    node.__map.markers = newMarkers;
    if (setBounds) {
      map.fitBounds(bounds);
      const zoom = map.getZoom();
      map.setZoom(zoom > 10 ? 10 : zoom);
    }
  });
};
