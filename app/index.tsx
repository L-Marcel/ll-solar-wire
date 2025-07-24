import { Colors } from '@/constants/Colors';
import useAsyncStorage from '@/hooks/useAsyncStorage';
import Decimal from 'decimal.js';
import { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { mask, MaskedTextInput } from "react-native-mask-text";
import Animated from 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Row, Rows, Table } from 'react-native-table-component';
import Icon from 'react-native-vector-icons/FontAwesome5';

const START_YEAR = 2023;
const TABLE_HEAD = ['Ano', 'Cobrança', 'Aumento', 'Consumo', 'Fio B', 'Disponibilidade', 'Tarifa'];
const TABLE_WIDTH_HEAD = [80, 80, 80, 120, 120, 120, 120];
const MAX_WIDTH = TABLE_WIDTH_HEAD.reduce((prev, curr) => {
  return prev + curr;
}, 0);

function getYearPercent(year = START_YEAR) {
  return new Decimal('0.15').mul(year - START_YEAR + 1);
};

function tarrifToDecimal(tarrif: string) {
  const t = mask(tarrif, [], "currency", { decimalSeparator: '.', precision: 2 });
  return new Decimal(t);
};

function consumeToDecimal(consume: string) {
  const c = mask(consume, [], "currency", { decimalSeparator: '.', precision: 2 });
  return new Decimal(c);
};

function bWireToDecimal(bWire: string) {
  const b = mask(bWire, [], "currency", { decimalSeparator: '.', precision: 7 });
  return new Decimal(b);
};

export default function HomeScreen() {
  const [tariff, setTariff] = useAsyncStorage('tariff', '90');
  const [consume, setConsume] = useAsyncStorage('consume', '339700');
  const [bWire, _] = useAsyncStorage('bwire', '2541366387');

  const t = useMemo(() => tarrifToDecimal(tariff), [tariff]);
  const c = useMemo(() => consumeToDecimal(consume), [consume]);
  const b = useMemo(() => bWireToDecimal(bWire), [bWire]);
  const percentage = useMemo(() => b.dividedBy(1000).dividedBy(t), [b, t]);

  const onResetTariff = () => {
    setTariff('90');
  };

  const onResetConsume = () => {
    setConsume('339700');
  };

  const getValue = useCallback((year = START_YEAR) => {
    return b.dividedBy(1000).mul(c).mul(getYearPercent(year));
  }, [b, c]);

  const priceByConsume = useMemo(() => getValue().dividedBy(c), [getValue, c]);

  const now = new Date();
  const rows = useMemo(() => Array.from({ length: 6 })
    .map((_, i) => START_YEAR + i)
    .filter((year) => year >= now.getFullYear())
    .map((year) => {
      const yearPercentage = getYearPercent(year).mul(100);
      const yearPercentageGain = yearPercentage.mul(percentage);
      const availabilityValue = t.mul(100);
      const value = getValue(year);
      
      const rawYearPercentage = mask(yearPercentage.toFixed(2).replace(".", ""), [], "currency", { groupSeparator: '.', decimalSeparator: ',', precision: 2, suffix: ' %' });
      const rawYearPercentageGain = mask(yearPercentageGain.toFixed(2).replace(".", ""), [], "currency", { groupSeparator: '.', decimalSeparator: ',', precision: 2, suffix: ' %' });
      const rawConsume = mask(c.toFixed(2).replace(".", ""), [], "currency", { groupSeparator: '.', decimalSeparator: ',', precision: 2, suffix: ' KWh' });
      const rawValue =  mask(value.toFixed(2).replace(".", ""), [], "currency", { groupSeparator: '.', decimalSeparator: ',', precision: 2, prefix: 'R$ ' });
      const rawAvailabilityValue =  mask(availabilityValue.toFixed(2).replace(".", ""), [], "currency", { groupSeparator: '.', decimalSeparator: ',', precision: 2, prefix: 'R$ ' });
      return [year, rawYearPercentage, rawYearPercentageGain, rawConsume, rawValue, rawAvailabilityValue, value.lessThan(availabilityValue)? rawAvailabilityValue:rawValue];
    }), [percentage, getValue]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <Animated.ScrollView>
          <View style={styles.container}>
            <View style={styles.field}>
              <Text>
                Valor tarifário por KWh
              </Text>
              <View style={styles.inputWithIcon}>
                <MaskedTextInput
                  value={tariff}
                  style={styles.input}
                  type="currency"
                  options={{
                    prefix: 'R$ ',
                    decimalSeparator: ',',
                    groupSeparator: '.',
                    precision: 2,
                  }}
                  onChangeText={(_, rawText) => {
                    setTariff(rawText);
                  }}
                  keyboardType="numeric"
                />
                <TouchableOpacity onPress={onResetTariff} style={styles.button}>
                  <Icon name="sync" size={18} color={Colors.tintContent}/>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.field}>
              <Text>
                Consumo da geração em KWh
              </Text>
              <View style={styles.inputWithIcon}>
                <MaskedTextInput
                  value={consume}
                  style={styles.input}
                  type="currency"
                  options={{
                    decimalSeparator: ',',
                    groupSeparator: '.',
                    precision: 2,
                  }}
                  onChangeText={(_, rawText) => {
                    setConsume(rawText);
                  }}
                  keyboardType="numeric"
                />
                <TouchableOpacity onPress={onResetConsume} style={styles.button}>
                  <Icon name="sync" size={18} color={Colors.tintContent}/>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.field}>
              <Text>
                Peso fio B na tarifa
              </Text>
              <MaskedTextInput
                value={percentage.mul(100).toFixed(2).replace(".","")}
                style={styles.inputDisabled}
                readOnly
                type="currency"
                options={{
                  decimalSeparator: ',',
                  groupSeparator: '.',
                  precision: 2,
                  suffix: " %"
                }}
                onChangeText={(_, rawText) => {}}
              />
            </View>
            <View style={styles.field}>
              <Text>
                Preço por cada KW consumido
              </Text>
              <MaskedTextInput
                value={priceByConsume.toFixed(4).replace(".","")}
                style={styles.inputDisabled}
                readOnly
                type="currency"
                options={{
                  prefix: 'R$ ',
                  decimalSeparator: ',',
                  groupSeparator: '.',
                  precision: 4
                }}
                onChangeText={(_, rawText) => {}}
              />
            </View>
            <ScrollView horizontal={true}>
              <View style={styles.table}>
                <Table borderStyle={{ borderWidth: 2, borderColor: Colors.base100 }}>
                  <Row data={TABLE_HEAD} widthArr={TABLE_WIDTH_HEAD} style={styles.tableHead} textStyle={styles.tableText} />
                  <Rows data={rows} widthArr={TABLE_WIDTH_HEAD} style={styles.tableRow} textStyle={styles.tableText}/>
                </Table>
              </View>
            </ScrollView>
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.base300,
  },
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
    width: '100%',
    backgroundColor: Colors.base300,
    gap: 8,
    padding: 16,
  },
  inputWithIcon: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  input: {
    flexGrow: 1,
    borderWidth: 2,
    backgroundColor: Colors.base200,
    borderColor: Colors.tint,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inputDisabled: {
    flexGrow: 1,
    borderWidth: 2,
    backgroundColor: Colors.base100,
    borderColor: Colors.tint,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  button: {
    aspectRatio: 1,
    backgroundColor: Colors.tint,
    color: Colors.text,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  field: {
    flexDirection: 'column',
    width: '100%',
    gap: 4,
    maxWidth: MAX_WIDTH,
  },
  table: { flex: 1, padding: 0, marginTop: 8, borderColor: Colors.tint, backgroundColor: Colors.base300, borderRadius: 8, overflow: 'hidden', borderWidth: 2 },
  tableHead: {  height: 40,  backgroundColor: Colors.base200  },
  tableRow: {  minHeight: 28 },
  tableText: { textAlign: 'center', padding: 8 }
});
