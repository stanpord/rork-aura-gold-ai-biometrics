import React from 'react';
import { StyleSheet, Animated, View, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// 1. STYLES DEFINED AT TOP (Prevents ReferenceError)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    height: 250,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: 32,
    gap: 16,
    backgroundColor: '#000',
  },
});

interface Props {
  children: React.ReactNode;
  headerImage: React.ReactElement;
  headerBackgroundColor: { dark: string; light: string };
}

// 2. COMPONENT EXPORT
export default function ParallaxScrollView({
  children,
  headerImage,
  headerBackgroundColor,
}: Props) {
  const scrollY = new Animated.Value(0);

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <Animated.View
          style={[
            styles.header,
            {
              backgroundColor: headerBackgroundColor.dark,
              transform: [
                {
                  translateY: scrollY.interpolate({
                    inputRange: [-250, 0, 250],
                    outputRange: [-125, 0, 187.5],
                  }),
                },
                {
                  scale: scrollY.interpolate({
                    inputRange: [-250, 0, 250],
                    outputRange: [2, 1, 1],
                  }),
                },
              ],
            },
          ]}
        >
          {headerImage}
        </Animated.View>
        <View style={styles.content}>{children}</View>
      </Animated.ScrollView>
    </View>
  );
}
