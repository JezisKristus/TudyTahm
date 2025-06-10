using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TT_API.Models
{
    public class Label
    {

        [Key]
        public int LabelID { get; set; }
        public int IDMap { get; set; }
        public string Color { get; set; }
        public string Name { get; set; }

        [ForeignKey("IDMap")]
        public Map Map { get; set; }
    }
}
