package com.velauto.config;

import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.PropertySource;
import org.springframework.core.io.support.DefaultPropertySourceFactory;
import org.springframework.core.io.support.EncodedResource;

import java.io.IOException;

public class YamlPropertySourceFactory extends DefaultPropertySourceFactory {

  @Override
  public PropertySource<?> createPropertySource(String name, EncodedResource resource) throws IOException {
    if (resource == null) {
      return super.createPropertySource(name, resource);
    }

    if (resource.getResource().getFilename() != null && resource.getResource().getFilename().endsWith(".yaml")) {
      YamlPropertySourceLoader loader = new YamlPropertySourceLoader();
      return loader.load(resource.getResource().getFilename(), resource.getResource()).get(0);
    }

    return super.createPropertySource(name, resource);
  }
}

