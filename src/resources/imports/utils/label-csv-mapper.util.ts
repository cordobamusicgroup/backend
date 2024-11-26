export function mapLabelCsvToIntermediate(row: any) {
  return {
    labelData: {
      name: row['Producer Name'],
      status: row['Status'],
    },
    wp_id: parseInt(row['User ID']),
  };
}
